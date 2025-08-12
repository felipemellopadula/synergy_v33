-- Create public 'images' bucket for frame uploads
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Allow public read access to files in the 'images' bucket
create policy "Public read access for images"
on storage.objects
for select
using (bucket_id = 'images');

-- Allow authenticated users to upload files to the 'images' bucket
create policy "Authenticated can upload images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'images');