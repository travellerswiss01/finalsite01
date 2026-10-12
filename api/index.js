import {createApp} from '../src/server.js';
const app=createApp();
export default app.listeners('request')[0];
