#!/usr/bin/env node
// PreToolUse Agent|Task: the spawn of a kit agent must fit the step. The builder needs a plan (approved when it carries a
// Status line) and approved requirements; the verifier may not be put on the builder's model (the model that wrote the
// code must not be the one that judges it); the critic may not be put on the planner's model, and needs a plan to judge.
// Isolation by code, not by a sentence in a prompt. Denial: exit 2.
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { readHookInput, projectRoot, deny, isMain, runGuard } from './hook-common.mjs';
import { loadRoles, roleName, roleOf, isJudge, parseFrontmatter, KIT_ROOT } from './roles.mjs';
import { readPlan, readText, requirementsApproved, APPROVED_STATUS, PLAN_FILE, REQUIREMENTS_FILE } from './scope.mjs';

export function decide(input, roles = loadRoles()) {
  if (input.tool_name !== 'Agent' && input.tool_name !== 'Task') return null;
  const caller = roleOf(input, roles);
  if (isJudge(caller)) return `${caller.name} delegates nothing: a judge reads and reports itself, it does not spawn an agent that could write for it.`;
  const t = input.tool_input ?? {};
  const name = roleName(t.subagent_type);
  const role = name ? roles.get(name) : null;
  if (!role) return null;
  const root = projectRoot(input);
  if (role.writes === 'slice') {
    if (!readPlan(root)) return `Denied: ${role.name} builds slices of ${PLAN_FILE}, and there is none; run /sdlc:plan-slices first.`;
    if (!APPROVED_STATUS.test(readText(join(root, PLAN_FILE)))) return `Denied: ${PLAN_FILE} is not approved (no "Status: approved" line); the human approves the plan before anyone builds it.`;
    if (!requirementsApproved(root)) return `Denied: ${REQUIREMENTS_FILE} is not approved (Status: approved); the human approves the requirements before anyone builds.`;
  }
  if (role.name === 'verifier' && typeof t.model === 'string' && t.model.trim()) {
    const builder = [...roles.values()].find((r) => r.writes === 'slice');
    const requested = t.model.trim().toLowerCase();
    if (builder?.model && requested.includes(String(builder.model).toLowerCase())) {
      return `Denied: the verifier may not run on ${t.model}, the model that wrote the code (${builder.name}); leave the model unset so the verifier's own (${role.model ?? 'its frontmatter'}) applies.`;
    }
  }
  if (role.name === 'critic') {
    if (!readPlan(root)) return `Denied: the critic judges ${PLAN_FILE}, and there is none; run /sdlc:plan-slices first.`;
    const planner = plannerModel(roles);
    if (planner && typeof t.model === 'string' && t.model.trim().toLowerCase().includes(planner)) {
      return `Denied: the critic may not run on ${t.model}, the model that wrote the plan (the planner); leave the model unset so the critic's own (${role.model ?? 'its frontmatter'}) applies.`;
    }
  }
  return null;
}

/** The planner's model, lower-cased: the planner agent's frontmatter when the kit has one, else the model line of the plan-slices skill. */
export function plannerModel(roles = loadRoles(), kitRoot = KIT_ROOT) {
  const agent = roles.get('planner')?.model;
  if (agent) return String(agent).toLowerCase();
  const skill = join(kitRoot, 'skills/plan-slices/SKILL.md');
  const model = existsSync(skill) ? parseFrontmatter(readFileSync(skill, 'utf8')).model : null;
  return model ? String(model).toLowerCase() : null;
}

if (isMain(import.meta.url)) runGuard((input) => decide(input));
