import type { Lang } from './copy';

const ACCENT = '#B0512E';
const MUTED = '#6B675F';

export interface TranscriptLine {
	who: string;
	color: string;
	text: string;
}

export const TRANSCRIPTS: Record<Lang, TranscriptLine[]> = {
	es: [
		{ who: 'Marta', color: ACCENT, text: 'Buenas tardes, soy Marta, una asistente de inteligencia artificial. Llamo de parte de un inquilino interesado en el piso de la calle Sueca.' },
		{ who: 'Agente', color: MUTED, text: '¿Sigue disponible? Sí, sí. ¿Cuándo querría verlo?' },
		{ who: 'Marta', color: ACCENT, text: 'Mi cliente puede el jueves a partir de las 17:00 o el viernes por la mañana. ¿Qué le viene mejor?' },
		{ who: 'Agente', color: MUTED, text: 'El jueves a las 17:30 me va perfecto. ¿Me pasa su nombre?' },
	],
	en: [
		{ who: 'Marta', color: ACCENT, text: "Good afternoon, I'm Marta, an AI assistant. I'm calling on behalf of a tenant interested in the flat on Calle Sueca." },
		{ who: 'Agent', color: MUTED, text: 'Is it still available? Yes, yes. When would they like to see it?' },
		{ who: 'Marta', color: ACCENT, text: 'My client is free Thursday from 5pm, or Friday morning. Which suits you better?' },
		{ who: 'Agent', color: MUTED, text: 'Thursday at 5:30 works perfectly. Can I take their name?' },
	],
};
