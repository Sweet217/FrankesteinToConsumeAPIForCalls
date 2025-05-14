<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Call Control</h1>

    <!-- Profile Selection -->
    <div class="form-group">
      <label for="profileSelect" class="font-weight-bold">Select Profile:</label>
      <select
        id="profileSelect"
        v-model="selectedProfile"
        class="form-control"
        @change="updatePrompt"
      >
        <option v-for="profile in profiles" :key="profile.id" :value="profile">
          {{ profile.name }}
        </option>
      </select>
    </div>

    <!-- Phone Number Input -->
    <div class="form-group">
      <label for="toPhoneNumber" class="font-weight-bold">To Phone Number:</label>
      <input
        id="toPhoneNumber"
        type="text"
        v-model="toPhoneNumber"
        class="form-control"
        placeholder="+1 485 595 3394 (Example Number)"
      />
    </div>

    <!-- Call Button -->
    <div class="d-flex justify-content-center mt-3">
      <button
        @click="startCall"
        :disabled="loadingCall || !toPhoneNumber"
        class="btn btn-primary"
      >
        {{ loadingCall ? "Calling..." : "Call Phone" }}
      </button>
    </div>

    <!-- Error Message -->
    <p v-if="callError" class="text-danger mt-3 text-center">{{ callError }}</p>

    <!-- Call History Section -->
    <h2 class="mt-5">Call History with Details</h2>

    <!-- Refresh Transcripts Button -->
    <div class="d-flex justify-content-center">
      <button
        @click="fetchAllTranscripts"
        :disabled="loadingAllTranscripts"
        class="btn btn-secondary mt-3"
      >
        {{ loadingAllTranscripts ? "Loading Transcripts..." : "Refresh Transcripts" }}
      </button>
    </div>
    <p v-if="allTranscriptsError" class="text-danger text-center mt-3">
      {{ allTranscriptsError }}
    </p>

    <!-- Transcripts List -->
    <div
      v-if="allTranscriptsWithRecordings && allTranscriptsWithRecordings.length > 0"
      class="mt-4"
    >
      <ul class="list-group">
        <li
          v-for="transcript in allTranscriptsWithRecordings"
          :key="transcript.transcriptSid"
          class="list-group-item"
        >
          <div class="d-flex justify-content-between">
            <div>
              <strong>Transcript SID:</strong> {{ transcript.transcriptSid }} ({{
                formatDate(transcript.dateCreated)
              }}) - Duration: {{ transcript.duration }} seconds
              <p v-if="transcript.callSid">
                <strong>Call SID:</strong> {{ transcript.callSid }}
              </p>
              <strong>From Number:</strong> {{ transcript.fromNumber }}
              <p><strong>To Number:</strong> {{ transcript.toNumber }}</p>
            </div>
            <div>
              <button
                v-if="loadingTranscriptDetails !== transcript.transcriptSid"
                @click="loadTranscriptSentences(transcript.transcriptSid)"
                class="btn btn-info btn-sm"
              >
                Load Transcript
              </button>
              <p v-else>Loading Transcript...</p>
              <button
                v-if="transcript.sentences && transcript.sentences.length > 0"
                @click="downloadTranscript(transcript)"
                class="btn btn-success btn-sm ml-2 m-2"
              >
                Download Transcript
              </button>
            </div>
          </div>

          <!-- AI Performance Evaluation Section -->
          <div
            v-if="transcript.sentences && transcript.sentences.length > 0"
            class="mt-3"
          >
            <h3>AI Performance Evaluation</h3>
            <div
              v-if="agentEvaluation(transcript)"
              :class="[
                'p-3',
                'border',
                'rounded',
                evaluationClass(agentEvaluation(transcript).grade),
              ]"
            >
              <div class="d-flex align-items-center mb-2">
                <div class="grade-circle mr-3">
                  {{ agentEvaluation(transcript).grade }}
                </div>
                <div>
                  <h4 class="mb-0">
                    {{ evaluationTitle(agentEvaluation(transcript).grade) }}
                  </h4>
                  <small>Out of 10</small>
                </div>
              </div>
              <p class="mb-2">
                <strong>Feedback:</strong> "{{ agentEvaluation(transcript).feedback }}"
              </p>
              <div v-if="agentEvaluation(transcript).analysis" class="mt-2">
                <p class="mb-1"><strong>Analysis:</strong></p>
                <ul>
                  <li
                    v-for="(item, index) in agentEvaluation(transcript).analysis"
                    :key="index"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
            <p v-else class="text-muted">
              No performance evaluation available for this call.
            </p>
          </div>

          <!-- Recording Section -->
          <div v-if="transcript.recordingUrl" class="mt-3">
            <h3>Recording</h3>
            <audio :src="transcript.recordingUrl" controls class="w-100"></audio>
          </div>

          <!-- Transcript Sentences with Toggle -->
          <div
            v-if="transcript.sentences && transcript.sentences.length > 0"
            class="mt-3"
          >
            <div class="d-flex justify-content-between align-items-center">
              <h3>Transcript</h3>
              <button
                @click="toggleTranscript(transcript.transcriptSid)"
                class="btn btn-sm btn-outline-secondary"
              >
                {{ showTranscripts[transcript.transcriptSid] ? "Hide" : "Show" }}
              </button>
            </div>
            <div v-if="showTranscripts[transcript.transcriptSid]">
              <div
                v-for="sentence in transcript.sentences"
                :key="sentence.sid"
                :class="{
                  'participant-1': sentence.media_channel === 1,
                  'participant-2': sentence.media_channel === 2,
                }"
                class="p-2 mb-2 border rounded"
              >
                <p class="mb-1" style="color: black">{{ sentence.transcript }}</p>
                <small
                  >Confidence: {{ parseFloat(sentence.confidence).toFixed(2) }}</small
                >
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- No Transcripts Message -->
    <p
      v-else-if="
        allTranscriptsWithRecordings && allTranscriptsWithRecordings.length === 0
      "
      class="text-center mt-3"
    >
      No transcripts available.
    </p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      toPhoneNumber: "",
      loadingCall: false,
      callError: null,
      loadingAllTranscripts: false,
      allTranscriptsError: null,
      allTranscriptsWithRecordings: [],
      loadingTranscriptDetails: null,
      showTranscripts: {},
      selectedProfile: null,
      profiles: [
        {
          id: 1,
          from: "+1 801 693 4442",
          name: "PBS Support Assistant",
          voice: "coral",
          promptFile: "pbs_support_assistant.txt",
          prompt: "",
        },
        {
          id: 2,
          from: "+1 833 700 0978",
          name: "PBS Elderly Client",
          voice: "sage",
          promptFile: "pbs_elderly_client.txt",
          prompt: "",
        },
        {
          id: 3,
          from: "+1 954 314 8956",
          name: "Karen Customer",
          voice: "alloy",
          promptFile: "pbs_karen_customer.txt",
          prompt: "",
        },
        {
          id: 4,
          from: "+1 385 262 7063",
          name: "Customer with Gift Arrival Issue",
          voice: "echo",
          promptFile: "pbs_customer_gift_arrival_issue.txt",
          prompt: "",
        },
        {
          id: 5,
          from: "+1 385 217 3958",
          name: "Prank Customer (On test/Development)",
          voice: "ballad",
          promptFile: "pbs_customer_prank.txt",
          prompt: "",
        },
      ],
      currentPrompt: "",
      currentVoice: "",
    };
  },
  created() {
    this.selectedProfile = this.profiles[0];
    this.currentPrompt = this.selectedProfile.prompt;
    this.currentVoice = this.selectedProfile.voice;
  },
  methods: {
    async loadPrompts() {
      const promises = this.profiles.map((profile, index) => {
        if (!profile.promptFile) return Promise.resolve(); // Skip if no promptFile
        return fetch(`/FrankesteinToConsumeAPIForCalls/prompts/${profile.promptFile}`)
          .then((res) => res.text())
          .then((text) => {
            this.profiles[index].prompt = text;
          })
          .catch((err) => {
            console.error(`Failed to load ${profile.promptFile}:`, err);
          });
      });

      await Promise.all(promises);
    },
    updatePrompt() {
      this.currentPrompt = this.selectedProfile.prompt;
      this.currentVoice = this.selectedProfile.voice;
    },
    formatDate(isoString) {
      if (!isoString) return "";
      const date = new Date(isoString);
      return date.toLocaleString();
    },
    async startCall() {
      await this.loadPrompts();
      this.updatePrompt();
      console.log(this.currentPrompt);
      console.log(this.currentVoice);
      this.loadingCall = true;
      this.callError = null;

      try {
        const response = await fetch(
          "https://amused-warmth-production.up.railway.app/make-call",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: this.toPhoneNumber,
              prompt: this.currentPrompt,
              voice: this.currentVoice,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to initiate call");
        }

        const data = await response.json();
        console.log("Call initiated:", data.callSid);
      } catch (err) {
        this.callError = err.message;
        console.error("Call error:", err);
      } finally {
        this.loadingCall = false;
      }
    },
    async fetchAllTranscripts() {
      this.loadingAllTranscripts = true;
      this.allTranscriptsError = null;
      try {
        const response = await fetch(
          "https://amused-warmth-production.up.railway.app/all-transcripts-with-recordings"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch all transcripts with recordings");
        }
        const data = await response.json();
        this.allTranscriptsWithRecordings = data.transcriptsWithRecordings;
      } catch (err) {
        this.allTranscriptsError = err.message;
        console.error("Error fetching all transcripts:", err);
      } finally {
        this.loadingAllTranscripts = false;
      }
    },
    async loadTranscriptSentences(transcriptSid) {
      this.loadingTranscriptDetails = transcriptSid;
      try {
        const response = await fetch(
          `https://amused-warmth-production.up.railway.app/transcript-sentences/${transcriptSid}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch transcript for SID: ${transcriptSid}`);
        }
        const data = await response.json();
        const index = this.allTranscriptsWithRecordings.findIndex(
          (t) => t.transcriptSid === transcriptSid
        );
        if (index !== -1) {
          this.allTranscriptsWithRecordings[index].sentences = data.sentences;
          this.showTranscripts = {
            ...this.showTranscripts,
            [transcriptSid]: true,
          };
        }
      } catch (error) {
        console.error(`Error loading transcript for SID ${transcriptSid}:`, error);
      } finally {
        this.loadingTranscriptDetails = null;
      }
    },
    downloadTranscript(transcript) {
      const lines = transcript.sentences.map((sentence, index) => {
        const participant =
          sentence.media_channel === 1 ? "PBS Support Agent" : "Ai Agent";
        return `${participant} == ${sentence.transcript}`;
      });

      const content = lines.join("\n\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Transcript_${transcript.transcriptSid}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    toggleTranscript(transcriptSid) {
      this.showTranscripts = {
        ...this.showTranscripts,
        [transcriptSid]: !this.showTranscripts[transcriptSid],
      };
    },
    agentEvaluation(transcript) {
      if (!transcript.sentences || transcript.sentences.length === 0) return null;

      const lastSentences = transcript.sentences.slice(-10).reverse();
      let evaluation = {
        grade: null,
        feedback: null,
        analysis: [],
      };

      // Find the grade
      for (const sentence of lastSentences) {
        if (!evaluation.grade) {
          const gradeMatch = sentence.transcript.match(/(\d+)\s*(out of|\/|of)\s*10/i);
          if (gradeMatch) {
            evaluation.grade = parseInt(gradeMatch[1], 10);
            evaluation.feedback = sentence.transcript;
          }
        }
      }

      // If no grade is found, return null
      if (evaluation.grade === null) return null;

      // Simple analysis based on grade
      if (evaluation.grade === 0) {
        evaluation.analysis = [
          "Agent needs significant improvement",
          "Caller was extremely dissatisfied with the service",
          "Review call for major issues",
        ];
      } else if (evaluation.grade >= 8) {
        evaluation.analysis = [
          "Agent provided excellent service",
          "Caller seemed satisfied with the interaction",
          "Agent likely followed proper procedures",
        ];
      } else if (evaluation.grade >= 5) {
        evaluation.analysis = [
          "Agent provided adequate service",
          "Caller had some minor issues",
          "Room for improvement in some areas",
        ];
      } else {
        evaluation.analysis = [
          "Agent needs significant improvement",
          "Caller was dissatisfied with the service",
          "Review call for specific issues",
        ];
      }

      return evaluation;
    },

    evaluationClass(grade) {
      if (grade >= 8) return "grade-excellent";
      if (grade >= 5) return "grade-good";
      return "grade-poor";
    },

    evaluationTitle(grade) {
      if (grade >= 9) return "Outstanding";
      if (grade >= 8) return "Excellent";
      if (grade >= 7) return "Good";
      if (grade >= 6) return "Satisfactory";
      if (grade >= 5) return "Average";
      if (grade >= 3) return "Below Average";
      return "Poor";
    },
  },
  mounted() {
    this.fetchAllTranscripts();
  },
};
</script>

<style scoped>
.error {
  color: red;
}

.participant-1 {
  background-color: #71a2ca;
}

.participant-2 {
  background-color: #28867b;
}

.grade-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.grade-excellent {
  background-color: #d4edda;
  border: 2px solid #28a745;
}
.grade-excellent .grade-circle {
  background-color: #28a745;
  color: white;
}

.grade-good {
  background-color: #fff3cd;
  border: 2px solid #ffc107;
}
.grade-good .grade-circle {
  background-color: #ffc107;
  color: black;
}

.grade-poor {
  background-color: #f8d7da;
  border: 2px solid #dc3545;
}
.grade-poor .grade-circle {
  background-color: #dc3545;
  color: white;
}

.transcript-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

/* Custom scrollbar for transcript container */
.transcript-container::-webkit-scrollbar {
  width: 6px;
}

.transcript-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.transcript-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.transcript-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
