import { sequence } from 'astro:middleware';
import { mediaCache } from './media-cache';

export const onRequest = sequence(mediaCache);
