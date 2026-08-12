<template>
  <header class="header">
    <h1 class="title">
      サカバンペプシ製MEGAMOJI
      <span class="badge">サカバンペプシの改造版</span>
    </h1>
    <p class="description">
      カスタム絵文字をサクッと作れる<span class="nya">🐱</span>
    </p>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  flex-wrap: wrap;
  color: var(--fg);
  align-items: flex-end;
  gap: var(--spacingMedium);
}

.title {
  display: flex;
  align-items: baseline;
  gap: var(--spacingSmall);
  margin: 0;
  font-size: var(--fontSizeTitle);
  font-weight: bold;
  line-height: 1;
}

.badge {
  padding: 0.2em 0.6em;
  font-size: 0.32em;
  font-weight: bold;
  color: var(--bg);
  white-space: nowrap;
  background-color: var(--primary);
  border-radius: 999px;
}

.description {
  margin: 0;
  font-size: var(--fontSizeMedium);
  line-height: var(--multilineTextLineHeight);
  color: var(--fg);
}

.nya {
  cursor: pointer;
}

.nya:hover {
  display: inline-block;
  animation: nya 300ms ease-out;
}

.nya:hover::after {
  color: var(--border);
  content: " < nya!";
}

@keyframes nya {
  50% {
    transform: translateY(-2px);
  }
}
</style>
