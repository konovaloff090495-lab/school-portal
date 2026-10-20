// ЕДИНСТВЕННАЯ точка отправки лидов с клиента. Любая форма с именем/телефоном обязана
// вызывать submitLead() — тогда заявка автоматически уходит в Telegram и CRM Синергии
// (GraphQL sendLead, landCode mo_tilda_online_school, utm_source=gerasimov_lav) с
// контекстом визита (UTM, страница, реферер, ClientID Метрики).
// Прямой fetch('/api/leads/submit') из компонентов запрещён — см. scripts/check-lead-forms.sh.
import { getLeadContext } from './leadContext.js';
import { saveLeadProfile } from './leadProfile.js';
export async function submitLead(payload) {
    try {
        const res = await fetch('/api/leads/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                school: payload.school ?? 'Не указана',
                crm: payload.crm ?? true,
                ...getLeadContext(),
            }),
        });
        // Запоминаем контакты в браузере: витрина подарков (/spasibo/) предзаполняет ими
        // форму второго оффера — см. src/lib/leadProfile.ts.
        if (res.ok)
            saveLeadProfile({ name: payload.name, phone: payload.phone, email: payload.email });
        return res.ok;
    }
    catch {
        return false;
    }
}
