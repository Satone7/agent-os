/**
 * Flow commands implementation
 */

import { FlowLoader } from '../../flow/loader.js';
import * as os from 'node:os';
import * as path from 'node:path';


/**
 * List available flows
 */
export async function flowListCommand(): Promise<void> {
  const flowPaths = [
    path.join(os.homedir(), '.agent-os', 'flows'),
    path.join(process.cwd(), 'flows'),
  ];

  const flowLoader = new FlowLoader();
  for (const flowPath of flowPaths) {
    flowLoader.addFlowPath(flowPath);
  }
  await flowLoader.reload();

  console.log('\n📋 可用流程\n');

  const flows = await flowLoader.listFlows();

  if (flows.length === 0) {
    console.log('没有找到流程。\n');
    console.log('请确保流程目录中有 YAML 文件:');
    flowPaths.forEach((p) => console.log(`  - ${p}`));
    console.log();
    return;
  }

  for (const flow of flows) {
    console.log(`🔹 ${flow.name} (${flow.id})`);
    console.log(`   版本: ${flow.version}`);
    console.log(`   描述: ${flow.description}`);
    console.log(`   路径: ${flow.path}`);
    console.log();
  }
}

/**
 * Show flow details
 */
export async function flowShowCommand(flowId: string): Promise<void> {
  const flowPaths = [
    path.join(os.homedir(), '.agent-os', 'flows'),
    path.join(process.cwd(), 'flows'),
  ];

  const flowLoader = new FlowLoader();
  for (const flowPath of flowPaths) {
    flowLoader.addFlowPath(flowPath);
  }
  await flowLoader.reload();

  console.log(`\n📋 流程详情: ${flowId}\n`);

  try {
    const flow = await flowLoader.loadFlow(flowId);

    console.log(`名称: ${flow.name}`);
    console.log(`版本: ${flow.version}`);
    console.log(`描述: ${flow.description}`);
    console.log(`模型: ${flow.settings.defaultModel}`);

    console.log('\n触发条件:');
    console.log(`  关键词: ${flow.trigger.keywords.join(', ')}`);
    if (flow.trigger.patterns) {
      console.log(`  模式: ${flow.trigger.patterns.join(', ')}`);
    }

    console.log('\n阶段:');
    flow.phases.forEach((phase, index) => {
      console.log(`  ${index + 1}. ${phase.name} (${phase.id})`);
      console.log(`     描述: ${phase.description}`);
      if (phase.timeSlice) {
        console.log(`     时间片: ${phase.timeSlice.default}`);
      }
      console.log(`     最大重试: ${phase.config.maxRetries}`);
    });

    console.log('\n失败策略:');
    console.log(`  最大总重试: ${flow.settings.failurePolicy.maxTotalRetries}`);
    console.log(`  用户通知阈值: ${flow.settings.failurePolicy.userNotifyThreshold}`);
    console.log();
  } catch (error) {
    console.error(`\n❌ 流程未找到: ${flowId}\n`);
    console.log('使用以下命令查看可用流程:');
    console.log('  agent-os flow list\n');
  }
}