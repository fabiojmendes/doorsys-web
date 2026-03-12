<script setup>
import { AxiosError } from "axios";
import { onErrorCaptured } from "vue";
import { RouterView } from "vue-router";
import { useToast } from "vue-toastification";
import Navbar from "./components/Navbar.vue";

const toast = useToast();

onErrorCaptured((err) => {
  if (err instanceof AxiosError) {
    const message =
      err.response?.data?.msg || err.response?.data || err.message;
    toast.error(message);
    return false;
  } else {
    toast.error("Oops! Unkown error");
  }
  return true;
});
</script>

<template>
  <Navbar />
  <section class="container main-container">
    <RouterView />
  </section>
</template>
