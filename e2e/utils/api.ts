import { SurveyParams } from '../pages/surveyEditPage';
import { API_BASE_URL as API_BASE } from './config';

async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `API ${options?.method ?? 'GET'} ${path} failed (${res.status}): ${text}`,
    );
  }
  return res.json() as Promise<T>;
}

export async function setUserDefaultLanguage(
  language: string,
  mockUserId?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/users/me/default-language`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(mockUserId && { 'x-mock-user-id': mockUserId }),
    },
    body: JSON.stringify({ language }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `PATCH /users/me/default-language failed (${res.status}): ${text}`,
    );
  }
}

export async function postSurvey(params: SurveyParams): Promise<string> {
  const survey = await apiFetch<{
    id: number;
    pages: { id: number }[];
    thanksPage: object;
  }>('/surveys', { method: 'POST' });

  const extraPages = await Promise.all(
    params.pageNames
      .slice(1)
      .map(() =>
        apiFetch<{ id: number }>(`/surveys/${survey.id}/page`, {
          method: 'POST',
        }),
      ),
  );
  const allPages = [...survey.pages, ...extraPages];

  await apiFetch(`/surveys/${survey.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...survey,
      name: params.urlName,
      title: { fi: params.title },
      subtitle: { fi: params.subtitle },
      author: params.author,
      startDate: new Date(Date.now() - 3_600_000).toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 3_600_000).toISOString(),
      ...(params.languages && {
        enabledLanguages: Object.fromEntries(
          ['fi', 'en', 'se'].map((l) => [l, params.languages!.includes(l)]),
        ),
        localisationEnabled: params.languages.length > 1,
      }),
      thanksPage: {
        ...survey.thanksPage,
        title: { fi: params.thanksPage.title },
        text: { fi: params.thanksPage.text },
      },
      pages: allPages.map((page, i) => ({
        ...page,
        title: { fi: params.pageNames[i] },
      })),
    }),
  });

  return String(survey.id);
}
