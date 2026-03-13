/**
 * Start command implementation
 */

import inquirer from 'inquirer';
import { FlowLoader } from '../../flow/loader.js';
import { SessionManager } from '../../scheduler/session-manager.js';
import { Scheduler } from '../../scheduler/index.js';
import * as os from 'node:os';
import * as path from 'node:path';


interface StartOptions {
  flow?: string;
  request?: string;
}

/**
 * Execute the start command
 */
export async function startCommand(options: StartOptions): Promise<void> {
  console.log('\n🚀 Agent-OS v1.0.0\n');

  // Initialize components
  const workspaceRoot = path.join(os.homedir(), '.agent-os', 'workspaces');
  const flowPaths = [
    path.join(os.homedir(), '.agent-os', 'flows'),
    path.join(process.cwd(), 'flows'),
  ];

  const flowLoader = new FlowLoader();
  for (const flowPath of flowPaths) {
    flowLoader.addFlowPath(flowPath);
  }
  await flowLoader.reload();

  const sessionManager = new SessionManager(workspaceRoot);
  const scheduler = new Scheduler(flowLoader, sessionManager);

  // Get user request
  let userRequest = options.request;
  if (!userRequest) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'request',
        message: '请告诉我你想做什么？',
        validate: (input: string) =>
          input.trim().length > 0 || '请输入你的请求',
      },
    ]);
    userRequest = answers.request;
  }

  console.log(`\n我理解你想: ${userRequest}`);
  console.log('让我匹配一下流程...\n');

  try {
    // Create session
    const session = await scheduler.createSession(userRequest!);

    console.log(`✅ 匹配到流程: ${session.flowName}\n`);
    console.log(`Session ID: ${session.id}\n`);

    // Load flow details
    const flow = await flowLoader.loadFlow(session.flowId);

    console.log('这个流程包含以下阶段:');
    flow.phases.forEach((phase, index) => {
      console.log(`${index + 1}. ${phase.name} - ${phase.description}`);
    });

    console.log(`\n预计总时长: 约 ${estimateDuration(flow.phases.length)}\n`);

    // Confirm start
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '是否开始？',
        default: true,
      },
    ]);

    if (confirm) {
      session.state = 'running';
      await sessionManager.saveState(session);
      console.log('\n✅ 会话已启动！使用以下命令监控进度:');
      console.log(`  agent-os status ${session.id}`);
      console.log(`  agent-os list\n`);
    } else {
      console.log('\n已取消。');
    }
  } catch (error) {
    console.error('\n❌ 错误:', (error as Error).message);

    // Show available flows
    const flows = await flowLoader.listFlows();
    if (flows.length > 0) {
      console.log('\n可用的流程:');
      flows.forEach((f) => {
        console.log(`  - ${f.name} (${f.id})`);
      });
      console.log('\n提示: 使用 --flow <id> 指定流程');
    }
  }
}

/**
 * Estimate duration based on phase count
 */
function estimateDuration(phaseCount: number): string {
  const minutesPerPhase = 15;
  const totalMinutes = phaseCount * minutesPerPhase;

  if (totalMinutes < 60) {
    return `${totalMinutes} 分钟`;
  }

  const hours = Math.round(totalMinutes / 60);
  return `${hours} 小时`;
}