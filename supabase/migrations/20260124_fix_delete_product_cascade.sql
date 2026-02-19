-- Fix foreign key constraint to allow deleting products by cascading deletion to b2b_conversations

ALTER TABLE public.b2b_conversations
DROP CONSTRAINT IF EXISTS b2b_conversations_product_id_fkey;

ALTER TABLE public.b2b_conversations
ADD CONSTRAINT b2b_conversations_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES public.listed_products (id)
ON DELETE CASCADE;
