import './assets/main.css'
import router from './router'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';



import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App);

app.use(router);
app.mount('#app');
