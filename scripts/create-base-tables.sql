CREATE TABLE public.community_patterns (
    id character varying(36) NOT NULL,
    title text NOT NULL,
    creator text DEFAULT 'Larissa'::text NOT NULL,
    "creatorId" text,
    "projectType" text NOT NULL,
    "skillLevel" text NOT NULL,
    description text,
    "endProductImage" text,
    "yarnType" text,
    size text,
    sections jsonb NOT NULL,
    "yarnRequirements" jsonb,
    "hookRequirements" jsonb,
    "notionsRequirements" jsonb,
    "toolRequirements" jsonb,
    "needsStuffing" text,
    likes integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.patterns (
    id character varying(36) NOT NULL,
    "ownerId" text DEFAULT 'larissa'::text NOT NULL,
    title text NOT NULL,
    "projectType" text NOT NULL,
    "skillLevel" text NOT NULL,
    "yarnType" text,
    size text,
    "endProductImage" text,
    description text,
    "materialsNotes" text,
    "userNotes" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    sections jsonb NOT NULL,
    "yarnRequirements" jsonb,
    "hookRequirements" jsonb,
    "notionsRequirements" jsonb,
    "toolRequirements" jsonb,
    "needsStuffing" text,
    favorite boolean DEFAULT false NOT NULL,
    "counterState" jsonb,
    status text DEFAULT 'pattern'::text NOT NULL,
    started_at timestamp without time zone,
    finished_at timestamp without time zone
);
CREATE TABLE public.stash_items (
    id character varying(36) NOT NULL,
    "ownerId" text DEFAULT 'larissa'::text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    color text,
    volume text,
    size text,
    quantity integer DEFAULT 1 NOT NULL,
    description text,
    notes text
);
CREATE TABLE public.stash_notes (
    id character varying(36) NOT NULL,
    "ownerId" text DEFAULT 'larissa'::text NOT NULL,
    content text DEFAULT ''::text
);
ALTER TABLE ONLY public.community_patterns
    ADD CONSTRAINT community_patterns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.patterns
    ADD CONSTRAINT patterns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.stash_items
    ADD CONSTRAINT stash_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.stash_notes
    ADD CONSTRAINT stash_notes_pkey PRIMARY KEY (id);
