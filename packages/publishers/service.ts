import { z } from "zod";
import type {
  PublisherFormConfig,
  PublisherFormConfigSection,
  PublisherFormConfigField,
} from "./types";
import {
  savePublisherFormConfigInternal as saveConfig,
  getActivePublisherFormConfigInternal as getActiveConfig,
} from "./repository";

const fieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "email", "textarea", "select", "file", "checkbox"]),
  label: z.string().min(1),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
});

const configSchema = z.object({
  id: z.string().optional(),
  version: z.number().int().positive(),
  isActive: z.boolean(),
  sections: z.array(sectionSchema).min(1).max(20),
});

export function validatePublisherFormConfig(
  rawConfig: unknown
): Omit<PublisherFormConfig, "id" | "createdAt" | "updatedAt"> {
  const parsed = configSchema.parse(rawConfig);

  const totalFields = parsed.sections.reduce(
    (sum, section) => sum + section.fields.length,
    0
  );

  if (totalFields > 100) {
    throw new Error("Total fields across all sections cannot exceed 100");
  }

  return {
    version: parsed.version,
    isActive: parsed.isActive,
    sections: parsed.sections as PublisherFormConfigSection[],
  };
}

export async function savePublisherFormConfig(
  config: PublisherFormConfig | Omit<PublisherFormConfig, "id" | "createdAt" | "updatedAt">
): Promise<PublisherFormConfig> {
  const validated = validatePublisherFormConfig(config);
  return saveConfig(validated);
}

export async function getActivePublisherFormConfig(): Promise<PublisherFormConfig | null> {
  return getActiveConfig();
}

