import {
	renderControlPhoneMedia,
	renderGridMedia,
	renderMasonryMedia,
	renderPaletteMedia,
	renderPhoneCatalogMedia,
	renderTalkMedia,
} from "./interface-case-media.js";
import { joinMarkup } from "../shared.js";

const CASES = [
	{
		title: "Интерфейс и коммуникация",
		paragraphs: [
			"В этом блоке собраны экраны, где нужно было быстро объяснить продукт, показать логику подписки и не потерять ритм бренда.",
		],
		items: [
			"подача продукта на первом экране",
			"связка интерфейса и бренд-системы",
			"структура для лендингов и презентаций",
			"единый тон визуальной коммуникации",
		],
		visit: "Кейс объединяет интерфейсные сцены, промо-подачу и продуктовый narrative Jestei Pool.",
		renderMedia: renderTalkMedia,
	},
	{
		title: "Модульная сетка носителей",
		paragraphs: [
			"Сетка помогала удерживать разные продуктовые карточки и графические элементы в одной системе без ощущения случайного коллажа.",
			"Она использовалась как для экранов и баннеров, так и для быстрых брендовых компоновок внутри продукта.",
		],
		items: [
			"единый ритм карточек",
			"масштабирование под разные форматы",
			"связь палитры и носителей",
			"быстрая сборка промо-материалов",
		],
		visit: "Здесь показана сеточная логика, которая держала вместе интерфейсные, брендовые и промо-элементы.",
		renderMedia: renderGridMedia,
	},
	{
		title: "Мобильный каталог",
		paragraphs: [
			"Отдельная задача была в том, чтобы мобильная витрина оставалась читаемой, даже когда на одном экране сталкиваются обложки, фильтры и продуктовые акценты.",
		],
		items: [
			"компактные карточки",
			"читаемая иерархия",
			"акцент на обложках и категориях",
			"сохранение плотности без визуального шума",
		],
		visit: "Фокус этого кейса — мобильная компоновка каталога и поведение карточек на узких экранах.",
		renderMedia: renderPhoneCatalogMedia,
	},
	{
		title: "Палитра и сигналы",
		paragraphs: [
			"Палитра использовалась не как декоративный набор, а как рабочая карта для состояний, продуктов и сценариев внутри экосистемы.",
		],
		items: [
			"цветовые роли для разных продуктов",
			"акценты для промо и онбординга",
			"сигналы для интерфейсных состояний",
			"узнаваемость без перегруза",
		],
		visit: "Этот блок показывает, как цвет поддерживал навигацию, продуктовые различия и общий характер бренда.",
		renderMedia: renderPaletteMedia,
	},
	{
		title: "Управление и фильтрация",
		paragraphs: [
			"В продукте было важно быстро находить треки и управлять состояниями без лишней сложности, особенно для диджейских сценариев и плотных интерфейсов.",
		],
		items: [
			"контрольные элементы без перегрузки",
			"понятные паттерны фильтрации",
			"ритм в сложных мобильных экранах",
			"сборка управления в компактный модуль",
		],
		visit: "Кейс про рабочие контролы, фильтрацию и структуру мобильного product-flow.",
		renderMedia: renderControlPhoneMedia,
	},
	{
		title: "Контентная витрина",
		paragraphs: [
			"Когда на одной странице много графики и разных форматов, нужен предсказуемый контейнер, который держит визуальный темп и не ломает восприятие.",
		],
		items: [
			"модульная раскладка контента",
			"адаптация под плотные подборки",
			"связь обложек и фирменной графики",
			"плавная витрина для серийных материалов",
		],
		visit: "Здесь собрана логика витрины для плотных подборок, промо-материалов и сериализованного контента.",
		renderMedia: renderMasonryMedia,
	},
];

const renderCopy = ({ title, paragraphs, items, visit }) => `
	<aside class="interface-cases__copy">
		<h2>${title}</h2>
		${joinMarkup(paragraphs, (paragraph) => `<p>${paragraph}</p>`)}
		<ul>${joinMarkup(items, (item) => `<li>${item}</li>`)}</ul>
		<p class="interface-cases__visit">${visit}</p>
	</aside>
`;

const renderCase = (item) => `
	<article class="interface-cases__case">
		${renderCopy(item)}
		<section class="interface-cases__media">${item.renderMedia()}</section>
	</article>
`;

export const renderJesteiInterfaceCases = () => joinMarkup(CASES, renderCase);

export function mountJesteiInterfaceCases(containerId = "jestei-interface-cases") {
	const container = document.getElementById(containerId);

	if (!container || container.dataset.mounted === "true") {
		return;
	}

	container.dataset.mounted = "true";
	container.innerHTML = renderJesteiInterfaceCases();
}
