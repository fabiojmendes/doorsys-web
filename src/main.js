import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "vue-toastification/dist/index.css";
import "./assets/main.css";

import { createAuth0 } from "@auth0/auth0-vue";
import axios from "axios";
import { createApp } from "vue";
import Toast, { POSITION } from "vue-toastification";
import App from "./App.vue";
import router from "./router.js";

const app = createApp(App);

const api = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

const options = {
	position: POSITION.TOP_CENTER,
	timeout: 2000,
};

const auth0 = createAuth0({
	domain: import.meta.env.VITE_AUTH0_DOMAIN,
	clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
	useRefreshTokens: true,
	cacheLocation: "localstorage",
	authorizationParams: {
		redirect_uri:
			import.meta.env.VITE_AUTH0_CALLBACK_URL || window.location.origin,
		audience: "doorsys-api",
	},
});

api.interceptors.request.use(async (config) => {
	try {
		const token = await auth0.getAccessTokenSilently();
		config.headers.Authorization = `Bearer ${token}`;
	} catch (e) {
		// If not authenticated or error, continue without token
	}
	return config;
});

app
	.use(router)
	.use(Toast, options)
	.use(auth0)
	.provide("api", api)
	.mount("#app");
