import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { palette, glyphs } from "./design-system.js";
import type { ProcessFlow, Workflow } from "@ada/compiler";

// ─── Single step ──────────────────────────────────────────────────────────────

interface WorkflowStepProps {
  readonly step: Workflow["steps"][number];
  readonly idx: number;
}

function WorkflowStep({ step, idx }: WorkflowStepProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Box>
        <Text color={palette.text.tertiary}>{"    "}</Text>
        <Text color={palette.text.secondary} wrap="truncate">
          {"{"}
          {step.hoareTriple.precondition}
          {"}"}
        </Text>
      </Box>
      <Box>
        <Text color={palette.text.tertiary}>{"    "}</Text>
        <Text color={palette.accent.dim}>{glyphs.pipeline.arrow} </Text>
        <Text color={palette.text.primary} wrap="truncate">
          {step.hoareTriple.action}
        </Text>
        <Text color={palette.text.dim}> {idx}</Text>
      </Box>
      <Box>
        <Text color={palette.text.tertiary}>{"    "}</Text>
        <Text color={palette.text.secondary} wrap="truncate">
          {"{"}
          {step.hoareTriple.postcondition}
          {"}"}
        </Text>
      </Box>
    </Box>
  );
}

// ─── Single workflow ──────────────────────────────────────────────────────────

interface WorkflowBlockProps {
  readonly workflow: Workflow;
  readonly maxSteps: number;
}

function WorkflowBlock({
  workflow,
  maxSteps,
}: WorkflowBlockProps): React.ReactElement {
  const [stepReveal, setStepReveal] = useState(0);
  const stepsToShow = workflow.steps.slice(0, maxSteps);

  useEffect(() => {
    if (stepReveal >= stepsToShow.length) return;
    const timer = setTimeout(() => {
      setStepReveal((c) => c + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [stepReveal, stepsToShow.length]);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.accent.primary}>{workflow.name}</Text>
      </Box>
      <Box>
        <Text color={palette.text.dim}>{"  trigger: "}</Text>
        <Text color={palette.text.tertiary} wrap="truncate">
          {workflow.trigger}
        </Text>
      </Box>
      <Text>{""}</Text>
      {stepsToShow.slice(0, stepReveal).map((step, i) => (
        <WorkflowStep key={i} step={step} idx={i + 1} />
      ))}
      {stepReveal < stepsToShow.length && (
        <Box>
          <Text color={palette.text.dim}>{"    "}</Text>
          <Text color={palette.text.tertiary}>{glyphs.pipeline.ellipsis}</Text>
        </Box>
      )}
      {workflow.steps.length > maxSteps && stepReveal >= maxSteps && (
        <Box>
          <Text color={palette.text.dim}>{"    "}</Text>
          <Text color={palette.text.tertiary}>
            {glyphs.pipeline.ellipsis} {workflow.steps.length - maxSteps} more
            steps
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ─── Workflow diagram ─────────────────────────────────────────────────────────

interface WorkflowDiagramProps {
  readonly data: ProcessFlow;
  readonly maxWorkflows?: number | undefined;
  readonly maxSteps?: number | undefined;
}

export function WorkflowDiagram({
  data,
  maxWorkflows = 3,
  maxSteps = 4,
}: WorkflowDiagramProps): React.ReactElement {
  const [wfReveal, setWfReveal] = useState(0);
  const workflows = data.workflows.slice(0, maxWorkflows);

  useEffect(() => {
    if (wfReveal >= workflows.length) return;
    const timer = setTimeout(() => {
      setWfReveal((c) => c + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, [wfReveal, workflows.length]);

  const edgeCases = data.workflows.reduce(
    (s, w) => s + w.steps.reduce((ss, st) => ss + st.failureModes.length, 0),
    0,
  );

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text color={palette.text.tertiary}>{"  "}</Text>
        <Text color={palette.text.secondary}>
          {data.workflows.length} workflows
          {"  "}
          {glyphs.pipeline.separator}
          {"  "}
          {edgeCases} edge cases
        </Text>
      </Box>
      <Text>{""}</Text>
      {workflows.slice(0, wfReveal).map((wf, i) => (
        <Box key={i} flexDirection="column">
          <WorkflowBlock workflow={wf} maxSteps={maxSteps} />
          {i < wfReveal - 1 && <Text>{""}</Text>}
        </Box>
      ))}
      {data.stateMachines.length > 0 && wfReveal >= workflows.length && (
        <>
          <Text>{""}</Text>
          <Box>
            <Text color={palette.text.dim}>{"  "}</Text>
            <Text color={palette.text.secondary}>STATE MACHINES</Text>
          </Box>
          {data.stateMachines.slice(0, 3).map((sm, i) => (
            <Box key={i}>
              <Text color={palette.text.dim}>{"  "}</Text>
              <Text color={palette.text.primary} wrap="truncate">
                {sm.entity}
                <Text color={palette.text.tertiary}>{": "}</Text>
                {sm.states.join(` ${glyphs.pipeline.arrow} `)}
              </Text>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}
