<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Call Control</h1>

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

          <!-- Recording Section -->
          <div v-if="transcript.recordingUrl" class="mt-3">
            <h3>Recording</h3>
            <audio :src="transcript.recordingUrl" controls class="w-100"></audio>
          </div>

          <!-- Transcript Sentences -->
          <div
            v-if="transcript.sentences && transcript.sentences.length > 0"
            class="mt-3"
          >
            <h3>Transcript</h3>
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
              <small>Confidence: {{ parseFloat(sentence.confidence).toFixed(2) }}</small>
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
import axios from "axios";

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
    };
  },
  methods: {
    formatDate(isoString) {
      if (!isoString) return "";
      const date = new Date(isoString);
      return date.toLocaleString();
    },
    async startCall() {
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
            body: JSON.stringify({ to: this.toPhoneNumber }),
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
        console.log("Fetched all transcripts:", this.allTranscriptsWithRecordings);
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
</style>
