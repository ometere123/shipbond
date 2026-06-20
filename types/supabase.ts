// Manual type definitions — regenerate with: supabase gen types typescript --local
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      login_nonces: {
        Row: {
          id: string;
          wallet: string;
          nonce: string;
          created_at: string;
          expires_at: string;
          used: boolean;
        };
        Insert: {
          id?: string;
          wallet: string;
          nonce: string;
          created_at?: string;
          expires_at?: string;
          used?: boolean;
        };
        Update: {
          id?: string;
          wallet?: string;
          nonce?: string;
          created_at?: string;
          expires_at?: string;
          used?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          wallet: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet?: string;
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          sponsor_wallet: string;
          title: string;
          description: string;
          terms_hash: string;
          reward_wei: string;
          bond_wei: string;
          deadline: string | null;
          contract_address: string | null;
          on_chain_id: string | null;
          status: MilestoneStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sponsor_wallet: string;
          title: string;
          description: string;
          terms_hash: string;
          reward_wei: string;
          bond_wei: string;
          deadline?: string | null;
          contract_address?: string | null;
          on_chain_id?: string | null;
          status?: MilestoneStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sponsor_wallet?: string;
          title?: string;
          description?: string;
          terms_hash?: string;
          reward_wei?: string;
          bond_wei?: string;
          deadline?: string | null;
          contract_address?: string | null;
          on_chain_id?: string | null;
          status?: MilestoneStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          milestone_id: string;
          builder_wallet: string;
          bond_tx_hash: string | null;
          evidence_refs: Json | null;
          evidence_digest: string | null;
          submit_tx_hash: string | null;
          status: SubmissionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          milestone_id: string;
          builder_wallet: string;
          bond_tx_hash?: string | null;
          evidence_refs?: Json | null;
          evidence_digest?: string | null;
          submit_tx_hash?: string | null;
          status?: SubmissionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          milestone_id?: string;
          builder_wallet?: string;
          bond_tx_hash?: string | null;
          evidence_refs?: Json | null;
          evidence_digest?: string | null;
          submit_tx_hash?: string | null;
          status?: SubmissionStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_milestone_id_fkey";
            columns: ["milestone_id"];
            referencedRelation: "milestones";
            referencedColumns: ["id"];
          }
        ];
      };
      evidence_files: {
        Row: {
          id: string;
          submission_id: string;
          uploader_wallet: string;
          file_name: string;
          storage_path: string;
          content_type: string | null;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          uploader_wallet: string;
          file_name: string;
          storage_path: string;
          content_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          uploader_wallet?: string;
          file_name?: string;
          storage_path?: string;
          content_type?: string | null;
          size_bytes?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_files_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          submission_id: string;
          request_tx_hash: string | null;
          verdict: "passed" | "partial_pass" | "failed" | "needs_human_review" | null;
          bond_action: "return" | "slash" | "hold" | null;
          reasoning_summary: string | null;
          validator_count: number | null;
          consensus_reached: boolean | null;
          result_tx_hash: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          request_tx_hash?: string | null;
          verdict?: "passed" | "partial_pass" | "failed" | "needs_human_review" | null;
          bond_action?: "return" | "slash" | "hold" | null;
          reasoning_summary?: string | null;
          validator_count?: number | null;
          consensus_reached?: boolean | null;
          result_tx_hash?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          request_tx_hash?: string | null;
          verdict?: "passed" | "partial_pass" | "failed" | "needs_human_review" | null;
          bond_action?: "return" | "slash" | "hold" | null;
          reasoning_summary?: string | null;
          validator_count?: number | null;
          consensus_reached?: boolean | null;
          result_tx_hash?: string | null;
          synced_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      settlements: {
        Row: {
          id: string;
          milestone_id: string;
          submission_id: string;
          review_id: string | null;
          verdict: "passed" | "partial_pass" | "failed";
          bond_action: "return" | "slash" | "hold";
          reward_to_builder: string | null;
          bond_returned: string | null;
          bond_slashed: string | null;
          settle_tx_hash: string | null;
          settled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          milestone_id: string;
          submission_id: string;
          review_id?: string | null;
          verdict: "passed" | "partial_pass" | "failed";
          bond_action: "return" | "slash" | "hold";
          reward_to_builder?: string | null;
          bond_returned?: string | null;
          bond_slashed?: string | null;
          settle_tx_hash?: string | null;
          settled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          milestone_id?: string;
          submission_id?: string;
          review_id?: string | null;
          verdict?: "passed" | "partial_pass" | "failed";
          bond_action?: "return" | "slash" | "hold";
          reward_to_builder?: string | null;
          bond_returned?: string | null;
          bond_slashed?: string | null;
          settle_tx_hash?: string | null;
          settled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "settlements_milestone_id_fkey";
            columns: ["milestone_id"];
            referencedRelation: "milestones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      access_audit: {
        Row: {
          id: string;
          wallet: string;
          action: string;
          resource: string | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet: string;
          action: string;
          resource?: string | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet?: string;
          action?: string;
          resource?: string | null;
          ip_hash?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type MilestoneStatus = "open" | "accepted" | "submitted" | "reviewing" | "settled" | "cancelled";
export type SubmissionStatus = "bonded" | "evidence_submitted" | "review_requested" | "verdict_received" | "settled";
export type Verdict = "passed" | "partial_pass" | "failed" | "needs_human_review";
export type BondAction = "return" | "slash" | "hold";
