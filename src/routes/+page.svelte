<script lang="ts">
	import { getAppInfo } from '#lib/backend.js';

	const appInfo = getAppInfo();
</script>

<main class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-2 p-6">
	{#await appInfo}
		<p class="text-muted-foreground">Caricamento…</p>
	{:then info}
		<h1 class="text-3xl font-semibold">{info.name}</h1>
		<p class="text-muted-foreground">Versione {info.version}</p>
	{:catch}
		<p class="text-destructive">Impossibile leggere la versione dell'applicazione.</p>
	{/await}
</main>
