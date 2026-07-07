"use client";

import React from "react";
import { PlatformChip } from "@/components/PlatformChip";
import { platformName } from "@/constants/platforms";

export interface RepoMapping {
  id: string;
  platform: string;
  repoFullName: string;
  visibility: string;
  defaultBranch: string;
  fileCount: number;
  lastSyncAt: string | null;
  folderConvention: string;
}

export interface RepositoryMappingProps {
  mappings: RepoMapping[];
  onSelect?: (repo: RepoMapping) => void;
  selectedPlatform?: string;
}

export function RepositoryMapping({ mappings, onSelect, selectedPlatform }: RepositoryMappingProps) {
  return (
    <section className="panel">
      <h2 className="h">
        Repository mapping{" "}
        <span className="tag" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)", fontWeight: 500 }}>
          one repo per platform
        </span>
      </h2>
      <div className="map">
        {mappings.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: 20 }}>
            No repositories linked yet.
          </div>
        ) : (
          mappings.map((m) => (
            <div
              className="map-row"
              key={m.id}
              style={{
                cursor: "pointer",
                borderColor: selectedPlatform === m.platform ? "var(--brand)" : undefined,
                background: selectedPlatform === m.platform ? "var(--brand-soft)" : undefined,
              }}
              onClick={() => onSelect?.(m)}
            >
              <PlatformChip platformId={m.platform} size="sm" showName={false} variant="ghost" />
              <span style={{ fontWeight: 600, fontSize: "14.5px" }}>
                {platformName(m.platform)}
              </span>
              <span className="arrow">→</span>
              <span className="repo">{m.repoFullName}</span>
              <span className="btn btn-secondary sm" style={{ marginLeft: "auto" }}>
                Browse
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
