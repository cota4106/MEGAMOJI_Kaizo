<script lang="ts">
import { defineComponent } from "vue";
import Button from "../inputs/Button.vue";

export default defineComponent({
  components: {
    Button,
  },
  methods: {
    backstage() {
      window.open("https://github.com/cota4106/MEGAMOJI_Kaizo");
    },
    donation() {
      window.open("https://note.com/zk_phi/n/n3a199c99d6d6");
    },
    share() {
      window.open("https://twitter.com/share?url=https://cota4106.github.io/MEGAMOJI_Kaizo/&text=カスタム絵文字メーカー%20MEGAMOJI(サカバンペプシ改造版)&hashtags=メガ文字");
    },
  },
});
</script>

<template>
  <footer class="footer">
    <p class="p">
      Built with ♡ by zk-phi
      <Button type="text" @click="donation">
        <template #icon>
          💝
        </template>
        MEGAMOJI本家制作者さんへの投げ銭
      </Button>
      /
      <Button type="text" @click="backstage">
        <template #icon>
          🛠
        </template>
        改造版のGitHubページ
      </Button>
      /
      <Button type="text" @click="share">
        <template #icon>
          🤝
        </template>
        Xでシェア
      </Button>
    </p>
    <p class="p">
      Modified by サカバンペプシ
      (<a class="link" href="https://github.com/zk-phi/MEGAMOJI" target="_blank" rel="noopener">元のMEGAMOJI</a>をベースに改造しています)
    </p>
    <p class="p">
      <img
          class="hit-counter"
          src="https://api.visitorbadge.io/api/visitors?user=cota4106&repo=MEGAMOJI_Kaizo&labelColor=%23555555&countColor=%2379C83D&label=views&style=default"
          alt="このページの閲覧数">
    </p>
    <p class="p footnote">
      Peace, Love, Unity, Respect 🫶
    </p>
  </footer>
</template>

<style scoped>
.footer {
  font-size: var(--fontSizeMedium);
  line-height: var(--multilineTextLineHeight);
  color: var(--fg);
}

.footnote {
  font-style: italic;
  color: var(--border);
}

.link {
  color: inherit;
}

.p {
  margin: 0 0 var(--spacingMedium);
}

.hit-counter {
  height: 20px;
  vertical-align: middle;
}
</style>
