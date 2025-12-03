export type PublisherApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type PublisherApplication = {
  id: string;
  status: PublisherApplicationStatus;
  configVersion: number | null;
  payload: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  internalNotes: string | null;
  publisherId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublisherApplicationFile = {
  id: string;
  applicationId: string;
  storageKey: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  source: string;
  isHtml: boolean;
  isImage: boolean;
  createdAt: string;
};

export type PublisherFormConfigSection = {
  id: string;
  title: string;
  description?: string;
  fields: PublisherFormConfigField[];
};

export type PublisherFormConfigField = {
  id: string;
  type: "text" | "email" | "textarea" | "select" | "file" | "checkbox";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
};

export type PublisherFormConfig = {
  id: string;
  version: number;
  isActive: boolean;
  sections: PublisherFormConfigSection[];
  createdAt: string;
  updatedAt: string;
};

export type ListPublisherApplicationsOptions = {
  status?: PublisherApplicationStatus;
  limit?: number;
  offset?: number;
};

export type UpdatePublisherApplicationStatusInput = {
  id: string;
  status: PublisherApplicationStatus;
  internalNotes?: string | null;
};

