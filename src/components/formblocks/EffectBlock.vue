<script lang="ts">
import { defineComponent, PropType } from "vue";
import Checkbox from "../inputs/Checkbox.vue";
import Fieldset from "../inputs/Fieldset.vue";
import Slider from "../inputs/Slider.vue";
import Space from "../global/Space.vue";
import { EffectParamDef } from "../../types";

type EffectOption = { label: string, value: unknown, params?: EffectParamDef[] };

export default defineComponent({
  components: {
    Fieldset, Space, Checkbox, Slider,
  },
  props: {
    modelValue: { type: Array as PropType<EffectOption[]>, required: true },
    effects: { type: Array, required: true },
    // current parameter values, keyed by effect label, then by param key
    paramValues: {
      type: Object as PropType<Record<string, Record<string, number>>>,
      default: () => ({}),
    },
  },
  emits: [
    "update:modelValue",
    "update:paramValues",
  ],
  methods: {
    isSelected(effect: EffectOption): boolean {
      return this.modelValue.some((item) => item === effect);
    },
    paramValue(effect: EffectOption, param: EffectParamDef): number {
      const current = this.paramValues[effect.label];
      if (current && typeof current[param.key] === "number") {
        return current[param.key];
      }
      return param.default;
    },
    setParamValue(effect: EffectOption, param: EffectParamDef, value: number): void {
      const clamped = Math.min(param.max, Math.max(param.min, value));
      this.$emit("update:paramValues", {
        ...this.paramValues,
        [effect.label]: {
          ...this.paramValues[effect.label],
          [param.key]: clamped,
        },
      });
    },
    onNumberInput(effect: EffectOption, param: EffectParamDef, raw: string): void {
      const value = Number(raw);
      if (raw === "" || Number.isNaN(value)) {
        return;
      }
      this.setParamValue(effect, param, value);
    },
    resetParamValue(effect: EffectOption, param: EffectParamDef): void {
      this.setParamValue(effect, param, param.default);
    },
    isDefault(effect: EffectOption, param: EffectParamDef): boolean {
      return this.paramValue(effect, param) === param.default;
    },
  },
});
</script>

<template>
  <Space vertical xlarge full>
    <Fieldset v-for="category in effects" :key="category.label" :label="category.label">
      <Space vertical full>
        <div v-for="effect in category.effects" :key="effect.label" class="effect-row">
          <Checkbox
              :name="effects.label"
              :value="effect"
              :model-value="modelValue"
              @update:model-value="$emit('update:modelValue', $event)">
            {{ effect.label }}
          </Checkbox>
          <div v-if="effect.params && isSelected(effect)" class="params">
            <div v-for="param in effect.params" :key="param.key" class="param">
              <div class="param-row">
                <span class="param-label">{{ param.label }}</span>
                <Slider
                    class="param-slider"
                    :model-value="paramValue(effect, param)"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step || (param.max - param.min) / 100"
                    block
                    @update:model-value="setParamValue(effect, param, $event)" />
                <input
                    class="param-number"
                    type="number"
                    :value="paramValue(effect, param)"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step || (param.max - param.min) / 100"
                    @change="onNumberInput(effect, param, ($event.target as HTMLInputElement).value)">
              </div>
              <button
                  class="param-reset"
                  type="button"
                  :disabled="isDefault(effect, param)"
                  @click="resetParamValue(effect, param)">
                既定値: {{ param.default }}{{ isDefault(effect, param) ? '' : ' に戻す' }}
              </button>
            </div>
          </div>
        </div>
      </Space>
    </Fieldset>
  </Space>
</template>

<style scoped>
.effect-row {
  width: 100%;
}

.params {
  padding: var(--spacingSmall) 0 var(--spacingMedium) var(--spacingLarge);
}

.param {
  margin-bottom: var(--spacingMedium);
}

.param-row {
  display: flex;
  align-items: center;
}

.param-label {
  flex: 0 0 4.5em;
  font-size: var(--fontSizeMedium);
  color: var(--fg);
  opacity: 0.7;
}

.param-slider {
  flex: 1 1 auto;
  min-width: 0;
}

.param-number {
  box-sizing: border-box;
  width: 4.5em;
  padding: var(--spacingSmall) var(--spacingInlineSmall);
  margin-left: var(--spacingMedium);
  font-size: var(--fontSizeMedium);
  line-height: 1;
  color: var(--fg);
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--borderRadiusSmall);
  outline: none;
}

.param-number:hover {
  border-color: var(--primary);
}

.param-number:focus {
  border-color: var(--primary);
  box-shadow: var(--primaryShadow);
}

.param-reset {
  padding: 0;
  margin: var(--spacingSmall) 0 0 4.5em;
  font-size: var(--fontSizeSmall, var(--fontSizeMedium));
  color: var(--fg);
  cursor: pointer;
  background: transparent;
  border: 0;
  opacity: 0.5;
}

.param-reset:not(:disabled):hover {
  color: var(--primary);
  text-decoration: underline;
  opacity: 1;
}

.param-reset:disabled {
  cursor: default;
  opacity: 0.35;
}
</style>
