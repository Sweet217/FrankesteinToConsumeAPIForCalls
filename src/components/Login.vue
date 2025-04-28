<template>
  <div
    style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f8f9fa;
    "
  >
    <div
      style="
        background-color: #fff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        width: 100%;
        text-align: center;
      "
    >
      <h2 style="font-size: 2rem; color: #333; margin-bottom: 20px">Login</h2>
      <div style="margin-bottom: 20px">
        <input
          v-model="password"
          type="password"
          placeholder="Enter Password"
          style="
            width: calc(100% - 20px);
            padding: 10px;
            font-size: 1rem;
            border: 1px solid #ccc;
            border-radius: 5px;
          "
        />
      </div>
      <div style="display: grid">
        <button
          @click="login"
          style="
            background-color: #007bff;
            color: #fff;
            padding: 12px;
            font-size: 1.1rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          "
        >
          Login
        </button>
      </div>
      <p v-if="error" style="color: red; margin-top: 15px">{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      password: "",
      error: "",
    };
  },
  methods: {
    login() {
      if (this.password === "2tW`A:r/09d97W,R#3e!%U&Y8") {
        localStorage.setItem("authenticated", "true");
        this.$router.push("/FrankesteinToConsumeAPIForCalls/make-call");
      } else {
        this.error = "Incorrect password";
      }
    },
  },
};
</script>
