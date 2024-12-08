-- Удаляем существующую таблицу и функции
drop function if exists drop_tracks_table();
drop function if exists create_tracks_table();
drop table if exists tracks;

-- Создаем таблицу tracks
create table tracks (
  id text primary key,
  spotify_id text,
  name text not null,
  artist text not null,
  genre text not null,
  year integer not null,
  popularity integer not null,
  image_url text,
  preview_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создаем индекс для spotify_id
create index idx_tracks_spotify_id on tracks(spotify_id);

-- Создаем функцию для удаления таблицы
create or replace function drop_tracks_table()
returns void as $$
begin
  drop table if exists tracks;
end;
$$ language plpgsql security definer;

-- Создаем функцию для создания таблицы
create or replace function create_tracks_table()
returns void as $$
begin
  create table tracks (
    id text primary key,
    spotify_id text,
    name text not null,
    artist text not null,
    genre text not null,
    year integer not null,
    popularity integer not null,
    image_url text,
    preview_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  
  create index idx_tracks_spotify_id on tracks(spotify_id);
end;
$$ language plpgsql security definer; 