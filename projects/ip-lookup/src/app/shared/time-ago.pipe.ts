import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | null | undefined, fallback = '—'): string {
    if (!value) return fallback;
    const hours = Math.round((Date.now() - new Date(value).getTime()) / 36e5);
    if (hours < 1) return 'Just now';
    if (hours < 48) return hours + ' hours ago';
    return Math.round(hours / 24) + ' days ago';
  }
}
