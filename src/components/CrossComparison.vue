<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Payload, Environment } from '../lib/dashboard';
import type { PerfMetric } from '../lib/data/types';
import { formatIps } from '../lib/dashboard';
import { channelColor } from '../lib/channels';

type GroupAxis = 'arch' | 'os_version' | 'os_family';

const props = defineProps<{
  payload: Payload;
  format: string;
  op: string;
  size: string;
}>();

const axis = ref<GroupAxis>('arch');

const AXES: { id: GroupAxis; label: string }[] = [
  { id: 'arch', label: 'Architecture' },
  { id: 'os_version', label: 'OS version' },
  { id: 'os_family', label: 'OS family' },
];

interface EnvCell {
  key: string;
  label: string;
  group: string;
  ips: number | null;
}

interface MatrixRow {
  serializer: string;
  cells: EnvCell[];
  best: number;
  worst: number;
}

const envEntries = computed(() => Object.entries(props.payload.environments));

function envGroup(key: string, env: Environment, ax: GroupAxis): string {
  const runner = key.replace(/-ruby-.*$/, '');
  switch (ax) {
    case 'arch':
      return env.arch === 'arm64' ? 'ARM64' : env.arch === 'x86_64' ? 'x86_64' : env.arch;
    case 'os_version':
      return runner.replace(/-arm$|-intel$|-large$/, '');
    case 'os_family':
      return runner.split('-')[0] === 'macos' ? 'macOS' : runner.split('-')[0] === 'ubuntu' ? 'Linux' : 'Windows';
  }
}

function envShortLabel(key: string, env: Environment): string {
  const runner = key.replace(/-ruby-.*$/, '');
  const parts = runner.split('-');
  const os = parts[0] === 'macos' ? 'macOS' : parts[0] === 'ubuntu' ? 'Ubuntu' : 'Windows';
  const version = parts[1] ?? '';
  const variant = runner.includes('-intel') ? ' Intel' : runner.includes('-arm') && parts[0] === 'ubuntu' ? ' ARM' : runner.includes('-arm') ? ' ARM' : '';
  return `${os} ${version}${variant}`;
}

const matrix = computed(() => {
  if (!props.payload.combined_results?.[props.op]?.[props.size]?.[props.format]) return [];

  const serializers = Object.keys(props.payload.combined_results[props.op][props.size][props.format]);
  const envs = envEntries.value.map(([key, env]) => ({
    key,
    env,
    group: envGroup(key, env, axis.value),
  }));

  const rows: MatrixRow[] = serializers.map((serializer) => {
    const cells: EnvCell[] = envs.map(({ key, env, group }) => {
      const metric = props.payload.combined_results[props.op][props.size][props.format][serializer]?.[key];
      return {
        key,
        label: envShortLabel(key, env),
        group,
        ips: metric && (metric as PerfMetric).iterations_per_second != null
          ? (metric as PerfMetric).iterations_per_second
          : null,
      };
    });

    const values = cells.filter((c) => c.ips != null).map((c) => c.ips!);
    return {
      serializer,
      cells,
      best: values.length ? Math.max(...values) : 0,
      worst: values.length ? Math.min(...values) : 0,
    };
  });

  return rows.sort((a, b) => b.best - a.best);
});

const groups = computed(() => {
  const set = new Set<string>();
  for (const row of matrix.value) {
    for (const cell of row.cells) set.add(cell.group);
  }
  return [...set].sort();
});

function heatColor(serializer: string, ips: number | null, best: number): string {
  if (ips == null || best <= 0) return 'transparent';
  const ratio = ips / best;
  const base = channelColor(serializer);
  // Parse hex to rgb
  const clean = base.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const alpha = 0.15 + ratio * 0.75;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function groupAvg(row: MatrixRow, group: string): number | null {
  const cells = row.cells.filter((c) => c.group === group && c.ips != null);
  if (!cells.length) return null;
  return cells.reduce((sum, c) => sum + c.ips!, 0) / cells.length;
}
</script>

<template>
  <section aria-label="Cross-environment comparison" class="mt-10">
    <div class="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
      <div>
        <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-inkmute">
          Cross-environment — same benchmark, every platform at once
        </p>
        <p class="font-mono text-[11px] text-inkmute mt-1">
          Heat intensity = relative speed within each library's row. Group columns by:
        </p>
      </div>
      <div class="flex border border-line divide-x divide-line" role="group">
        <button
          v-for="a in AXES"
          :key="a.id"
          type="button"
          class="px-3 py-1.5 font-mono text-xs transition-colors"
          :class="axis === a.id ? 'bg-phosphor text-phosphorink' : 'text-inkdim hover:text-ink'"
          :aria-pressed="axis === a.id"
          @click="axis = a.id"
        >
          {{ a.label }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto border border-line bg-panel rounded-lg">
      <table class="w-full border-collapse" v-if="matrix.length > 0">
        <thead>
          <tr>
            <th class="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-inkmute font-normal px-3 py-2 border-b border-line sticky left-0 bg-panel z-10">
              Library
            </th>
            <th
              v-for="env in matrix[0]?.cells ?? []"
              :key="env.key"
              class="text-center font-mono text-[9px] uppercase tracking-wider text-inkmute font-normal px-1 py-2 border-b border-line whitespace-nowrap"
            >
              <span :class="axis !== 'arch' ? '' : 'text-phosphor/70'">{{ env.group }}</span>
              <span class="block text-inkmute/70 normal-case">{{ env.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in matrix" :key="row.serializer">
            <td class="px-3 py-1.5 border-b border-line/50 font-mono text-[12px] whitespace-nowrap sticky left-0 bg-panel z-10">
              <span class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full shrink-0" :style="{ background: channelColor(row.serializer) }" />
                {{ row.serializer }}
              </span>
            </td>
            <td
              v-for="cell in row.cells"
              :key="cell.key"
              class="px-1 py-1.5 border-b border-line/50 text-center font-mono text-[11px] tabular"
              :style="{ background: heatColor(row.serializer, cell.ips, row.best) }"
              :title="`${row.serializer} on ${cell.label}: ${cell.ips ? formatIps(cell.ips) + ' ips' : 'not measured'}`"
            >
              <span v-if="cell.ips != null" :class="cell.ips === row.best ? 'text-ink font-semibold' : 'text-inkdim'">
                {{ formatIps(cell.ips) }}
              </span>
              <span v-else class="text-inkmute/40">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-center text-inkmute font-mono text-xs py-8">
        No data for {{ format }} · {{ op }} · {{ size }}
      </p>
    </div>

    <div v-if="groups.length > 1" class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
      <div v-for="g in groups" :key="g" class="font-mono text-[10px] text-inkmute">
        <span class="text-phosphor uppercase tracking-wider">{{ g }}</span>
        <span class="ml-2">{{ matrix.filter((r) => groupAvg(r, g) != null).length }} libraries · avg best {{ formatIps(Math.max(...matrix.map((r) => groupAvg(r, g) ?? 0))) }} ips</span>
      </div>
    </div>
  </section>
</template>
