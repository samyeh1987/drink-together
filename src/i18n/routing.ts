import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh-CN', 'th'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
