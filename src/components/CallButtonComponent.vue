<template>
  <div>
    <h1>Call Control</h1>

    <div style="margin-bottom: 20px">
      <label for="toPhoneNumber"><strong>To Phone Number:</strong></label
      ><br />
      <input
        id="toPhoneNumber"
        type="text"
        v-model="toPhoneNumber"
        placeholder="+1 485 595 3394 (Example Number)"
        style="padding: 8px; margin-top: 5px; width: 250px"
      />
    </div>

    <button @click="startCall" :disabled="loadingCall || !toPhoneNumber">
      {{ loadingCall ? "Calling..." : "Call Phone" }}
    </button>

    <p v-if="callError" class="error">{{ callError }}</p>

    <h2>Call History with Details</h2>
    <button @click="fetchAllTranscripts" :disabled="loadingAllTranscripts">
      {{ loadingAllTranscripts ? "Loading Transcripts..." : "Refresh Transcripts" }}
    </button>
    <p v-if="allTranscriptsError" class="error">{{ allTranscriptsError }}</p>

    <div v-if="allTranscriptsWithRecordings && allTranscriptsWithRecordings.length > 0">
      <ul>
        <li
          v-for="transcript in allTranscriptsWithRecordings"
          :key="transcript.transcriptSid"
        >
          <strong>Transcript SID:</strong> {{ transcript.transcriptSid }} ({{
            formatDate(transcript.dateCreated)
          }}) - Duration: {{ transcript.duration }} seconds
          <p v-if="transcript.callSid">
            <strong>Call SID:</strong> {{ transcript.callSid }}
          </p>
          <strong>From Number:</strong> {{ transcript.fromNumber }}
          <p><strong>To Number:</strong> {{ transcript.toNumber }}</p>

          <div v-if="transcript.recordingUrl">
            <h3>Recording</h3>
            <audio :src="transcript.recordingUrl" controls></audio>
          </div>

          <div v-if="transcript.sentences && transcript.sentences.length > 0">
            <h3>Transcript</h3>
            <div
              v-for="sentence in transcript.sentences"
              :key="sentence.sid"
              :class="{
                'participant-1': sentence.media_channel === 1,
                'participant-2': sentence.media_channel === 2,
              }"
            >
              <p style="color: black">{{ sentence.transcript }}</p>
              <small>Confidence: {{ parseFloat(sentence.confidence).toFixed(2) }}</small>
            </div>
          </div>
          <p v-else-if="loadingTranscriptDetails === transcript.transcriptSid">
            Fetching Transcript...
          </p>
          <div v-else>
            <button @click="loadTranscriptSentences(transcript.transcriptSid)">
              Load Transcript
            </button>
          </div>
        </li>
      </ul>
    </div>

    <p
      v-else-if="
        allTranscriptsWithRecordings && allTranscriptsWithRecordings.length === 0
      "
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
  },
  mounted() {
    this.fetchAllTranscripts();
  },
};
</script>

<style scoped>
/* Add your component-specific styles here */
.error {
  color: red;
  margin-top: 10px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding: 10px;
}

h3 {
  margin-top: 10px;
}

audio {
  width: 100%;
}

.participant-1 {
  background-color: #f0f0f0;
  padding: 5px;
  margin-bottom: 5px;
  border-radius: 5px;
  text-align: left;
}

.participant-2 {
  background-color: #e0f7fa;
  padding: 5px;
  margin-bottom: 5px;
  border-radius: 5px;
  text-align: right;
}
</style>
