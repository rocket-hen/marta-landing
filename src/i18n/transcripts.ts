import type { Lang } from './copy';

const ACCENT = '#B0512E';
const MUTED = '#6B675F';

export interface TranscriptLine {
	time: number; // seconds, matches /audio/call.mp3
	who: string;
	color: string;
	text: string;
}

// Demo call recording (public/audio/call.mp3): chalet adosado, Calle Creta,
// viewing booked for Wednesday 18:00 at the urbanización entrance by Cafetería
// Creta. The phone number in the dialogue is a demo number, not real.
export const TRANSCRIPTS: Record<Lang, TranscriptLine[]> = {
	es: [
		{ time: 0, who: 'Agente', color: MUTED, text: 'Dígame.' },
		{ time: 2, who: 'Marta', color: ACCENT, text: 'Hola, buenas.' },
		{ time: 4, who: 'Agente', color: MUTED, text: 'Hola, buenas. Dígame.' },
		{ time: 7, who: 'Marta', color: ACCENT, text: 'Le llamo por el chalet adosado de alquiler de la calle Creta, el de Idealista. ¿Sigue disponible?' },
		{ time: 14, who: 'Agente', color: MUTED, text: 'Sí, el chalet sigue disponible.' },
		{ time: 18, who: 'Marta', color: ACCENT, text: 'Perfecto. Soy Marta, la asistente de Paula Martínez, que busca un chalet adosado para ella y su pareja. ¿Le cuento el perfil para ver si encaja?' },
		{ time: 27, who: 'Agente', color: MUTED, text: 'Un momento. ¿Estoy hablando con un ordenador?' },
		{ time: 33, who: 'Marta', color: ACCENT, text: 'Sí, soy un asistente de inteligencia artificial, pero Paula Martínez es una persona real que busca vivienda para una pareja. Conozco su perfil y se lo cuento en un par de minutos. ¿Le parece?' },
		{ time: 45, who: 'Agente', color: MUTED, text: 'No sé… Prefiero que me llame ella directamente, mejor.' },
		{ time: 52, who: 'Marta', color: ACCENT, text: 'Entiendo. Solo necesito medio minuto para contarle el perfil y ver si encaja, así no hacemos perder el tiempo a nadie. Si encaja, después podrá hablar directamente con Paula. ¿Le cuento?' },
		{ time: 65, who: 'Agente', color: MUTED, text: 'Vale, va, cuéntame.' },
		{ time: 68, who: 'Marta', color: ACCENT, text: 'Perfecto. Es para Paula Martínez y su pareja. No tienen niños, no tienen mascotas y no fuman. Paula trabaja en tecnología con contrato indefinido en una empresa extranjera y gana más de tres veces el alquiler. Su pareja es médico en España con contrato español, y pueden aportar nóminas y aval bancario si hace falta. ¿Con este perfil le encaja para el chalet?' },
		{ time: 96, who: 'Agente', color: MUTED, text: 'Vale. Y has dicho que los dos tienen contrato español, ¿no?' },
		{ time: 103, who: 'Marta', color: ACCENT, text: 'Sí, eso es. Uno tiene contrato español y el otro extranjero. Entonces, ¿le encaja el perfil para seguir adelante?' },
		{ time: 110, who: 'Agente', color: MUTED, text: 'Ah, vale. Bueno, pues sí, en principio no habría ningún problema.' },
		{ time: 116, who: 'Marta', color: ACCENT, text: 'Perfecto. ¿Podemos programar una visita? A Paula le viene bien el miércoles de 5 a 8 de la tarde, el jueves por la mañana hasta las 12 o después de las 6, y el viernes de 4 a 9. ¿Qué día y hora le encajan?' },
		{ time: 134, who: 'Agente', color: MUTED, text: 'A ver, déjame ver… El miércoles podríamos quedar a las 6 de la tarde, si te parece.' },
		{ time: 141, who: 'Marta', color: ACCENT, text: 'Perfecto, el miércoles a las 6. ¿Quedamos confirmados?' },
		{ time: 145, who: 'Agente', color: MUTED, text: 'Sí, la visita está confirmada para el miércoles a las 6.' },
		{ time: 152, who: 'Marta', color: ACCENT, text: 'Perfecto. ¿Y dónde se reunirán el miércoles a las 6?' },
		{ time: 156, who: 'Agente', color: MUTED, text: 'La reunión sería en la entrada de la urbanización, junto a la cafetería Creta. No es en la dirección exacta del chalet. ¿Va bien?' },
		{ time: 166, who: 'Marta', color: ACCENT, text: 'Perfecto. En la entrada de la urbanización, junto a la cafetería Creta, en la dirección exacta del chalet. ¿Me da un número de teléfono para enviarle la confirmación y los datos de contacto de Paula Martínez?' },
		{ time: 178, who: 'Agente', color: MUTED, text: 'Sí, claro. Apunta: 624 546 123.' },
		{ time: 186, who: 'Marta', color: ACCENT, text: 'Perfecto. 624 546 123. ¿Tiene WhatsApp en ese número o prefiere que le llame? ¿O le llega mejor por SMS?' },
		{ time: 196, who: 'Agente', color: MUTED, text: 'Sí, sí tengo WhatsApp. Mejor por WhatsApp, por favor.' },
		{ time: 200, who: 'Marta', color: ACCENT, text: 'Perfecto. Le mandamos la confirmación y los datos de Paula por WhatsApp a ese número.' },
		{ time: 205, who: 'Agente', color: MUTED, text: 'Muchas gracias.' },
		{ time: 206, who: 'Marta', color: ACCENT, text: '¡Hasta luego!' },
	],
	en: [
		{ time: 0, who: 'Agent', color: MUTED, text: 'Hello?' },
		{ time: 2, who: 'Marta', color: ACCENT, text: 'Hello, good afternoon.' },
		{ time: 4, who: 'Agent', color: MUTED, text: 'Hello, good afternoon. Go ahead.' },
		{ time: 7, who: 'Marta', color: ACCENT, text: "I'm calling about the townhouse for rent on Calle Creta, the one on Idealista. Is it still available?" },
		{ time: 14, who: 'Agent', color: MUTED, text: 'Yes, the house is still available.' },
		{ time: 18, who: 'Marta', color: ACCENT, text: "Great. I'm Marta, Paula Martínez's assistant — she's looking for a townhouse for herself and her partner. Shall I run through her profile to see whether it's a fit?" },
		{ time: 27, who: 'Agent', color: MUTED, text: 'Hold on. Am I talking to a computer?' },
		{ time: 33, who: 'Marta', color: ACCENT, text: "Yes, I'm an AI assistant, but Paula Martínez is a real person looking for a home for a couple. I know her profile and I can go through it in a couple of minutes. Would that be alright?" },
		{ time: 45, who: 'Agent', color: MUTED, text: "I don't know… I'd rather she called me directly." },
		{ time: 52, who: 'Marta', color: ACCENT, text: "I understand. I only need thirty seconds to run through the profile and see if it's a fit — that way nobody wastes their time. If it works, you can speak to Paula directly afterwards. Shall I go ahead?" },
		{ time: 65, who: 'Agent', color: MUTED, text: 'Alright, go on, tell me.' },
		{ time: 68, who: 'Marta', color: ACCENT, text: "Thank you. It's for Paula Martínez and her partner. No children, no pets, non-smokers. Paula works in tech on a permanent contract with a foreign company and earns more than three times the rent. Her partner is a doctor in Spain on a Spanish contract, and they can provide payslips and a bank guarantee if needed. Does that profile work for the house?" },
		{ time: 96, who: 'Agent', color: MUTED, text: 'Right. And you said they both have Spanish contracts, correct?' },
		{ time: 103, who: 'Marta', color: ACCENT, text: "That's not quite it — one has a Spanish contract and the other a foreign one. So, does the profile work for us to move forward?" },
		{ time: 110, who: 'Agent', color: MUTED, text: "Ah, I see. Well, yes — in principle there shouldn't be any problem." },
		{ time: 116, who: 'Marta', color: ACCENT, text: 'Great. Can we schedule a viewing? Paula is free Wednesday from 5 to 8pm, Thursday morning until 12 or after 6, and Friday from 4 to 9. What day and time suit you?' },
		{ time: 134, who: 'Agent', color: MUTED, text: 'Let me see… We could meet Wednesday at 6pm, if that works for you.' },
		{ time: 141, who: 'Marta', color: ACCENT, text: 'Perfect — Wednesday at 6. Are we confirmed?' },
		{ time: 145, who: 'Agent', color: MUTED, text: 'Yes, the viewing is confirmed for Wednesday at 6.' },
		{ time: 152, who: 'Marta', color: ACCENT, text: 'Great. And where will they be meeting on Wednesday at 6?' },
		{ time: 156, who: 'Agent', color: MUTED, text: "You'd meet at the entrance to the residential complex, next to Cafetería Creta. Not at the exact address of the house. Does that work?" },
		{ time: 166, who: 'Marta', color: ACCENT, text: "Perfect. At the entrance to the complex, next to Cafetería Creta, at the exact address of the house. Could you give me a phone number so I can send the confirmation and Paula Martínez's contact details?" },
		{ time: 178, who: 'Agent', color: MUTED, text: 'Yes, of course. Take this down: 624 546 123.' },
		{ time: 186, who: 'Marta', color: ACCENT, text: 'Thank you. 624 546 123. Do you have WhatsApp on that number, or would you prefer a call? Or does SMS reach you better?' },
		{ time: 196, who: 'Agent', color: MUTED, text: 'Yes, I do have WhatsApp. WhatsApp is better, please.' },
		{ time: 200, who: 'Marta', color: ACCENT, text: "Perfect. We'll send the confirmation and Paula's details by WhatsApp to that number." },
		{ time: 205, who: 'Agent', color: MUTED, text: 'Thank you very much.' },
		{ time: 206, who: 'Marta', color: ACCENT, text: 'Goodbye!' },
	],
};
