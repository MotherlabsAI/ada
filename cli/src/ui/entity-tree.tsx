import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { palette, glyphs } from "./design-system.js";
import { useCountUp } from "./hooks.js";
import type { EntityMap, Entity } from "@ada/compiler";

// ─── Single entity item ───────────────────────────────────────────────────────

interface EntityItemProps {
  readonly entity: Entity;
  readonly isLast: boolean;
}

function EntityItem({ entity, isLast }: EntityItemProps): React.ReactElement {
  const [propReveal, setPropReveal] = useState(0);
  const totalItems = entity.invariants.length + entity.properties.length;

  useEffect(() => {
    if (propReveal >= totalItems) return;
    const timer = setTimeout(() => {
      setPropReveal((c) => c + 1);
    }, 50);
    return () => clearTimeout(timer);
  }, [propReveal, totalItems]);

  // Show invariants first (more important), then properties
  const allItems: Array<{ text: string; kind: "invariant" | "property" }> = [
    ...entity.invariants.map((inv) => ({
      text: inv.predicate,
      kind: "invariant" as const,
    })),
    ...entity.properties.slice(0, 3).map((prop) => ({
      text: `${prop.name}: ${prop.type}`,
      kind: "property" as const,
    })),
  ];

  const visibleItems = allItems.slice(0, propReveal);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={palette.text.dim}>{"  "}</Text>
        <Text color={palette.accent.primary}>{glyphs.identity.core} </Text>
        <Text color={palette.text.primary}>{entity.name}</Text>
        <Text color={palette.text.tertiary}>
          {" ("}
          {entity.category}
          {")"}
        </Text>
        {isLast && <Text color={palette.text.dim}>{""}</Text>}
      </Box>
      {visibleItems.map((item, i) => {
        const isLastItem = i === visibleItems.length - 1;
        const connector =
          isLastItem && propReveal >= allItems.length
            ? "\u2514\u2500\u2500 "
            : "\u251C\u2500\u2500 ";
        return (
          <Box key={i}>
            <Text color={palette.text.dim}>{"    "}</Text>
            <Text color={palette.text.dim}>{connector}</Text>
            <Text
              color={
                item.kind === "invariant"
                  ? palette.accent.primary
                  : palette.text.secondary
              }
              wrap="truncate"
            >
              {item.text}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Entity tree ──────────────────────────────────────────────────────────────

interface EntityTreeProps {
  readonly data: EntityMap;
  readonly maxEntities?: number | undefined;
}

export function EntityTree({
  data,
  maxEntities = 8,
}: EntityTreeProps): React.ReactElement {
  const [revealCount, setRevealCount] = useState(0);
  const entities = data.entities.slice(0, maxEntities);
  const displayCount = useCountUp(entities.length, 600);

  useEffect(() => {
    if (revealCount >= entities.length) return;
    const timer = setTimeout(() => {
      setRevealCount((c) => c + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [revealCount, entities.length]);

  const totalInv = data.entities.reduce((s, e) => s + e.invariants.length, 0);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text color={palette.text.tertiary}>{"  "}</Text>
        <Text color={palette.text.secondary}>entities </Text>
        <Text color={palette.accent.primary}>{displayCount}</Text>
        <Text color={palette.text.tertiary}>
          {"  "}
          {glyphs.pipeline.separator} {data.boundedContexts.length} contexts
          {"  "}
          {glyphs.pipeline.separator} {totalInv} invariants
        </Text>
      </Box>
      <Text>{""}</Text>
      {entities.slice(0, revealCount).map((entity, i) => (
        <EntityItem
          key={entity.name}
          entity={entity}
          isLast={i === revealCount - 1}
        />
      ))}
      {data.entities.length > maxEntities && revealCount >= maxEntities && (
        <Text color={palette.text.tertiary}>
          {"  "}
          {glyphs.pipeline.ellipsis} and {data.entities.length - maxEntities}{" "}
          more
        </Text>
      )}
    </Box>
  );
}
