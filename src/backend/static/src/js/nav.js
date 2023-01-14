"use strict"; // Start of use strict

// Toggle the side navigation
$("#sidebarToggle, #sidebarToggleTop").on("click", function (e) {
	$("body").toggleClass("sidebar-toggled");
	$(".sidebar").toggleClass("toggled");
	if ($(".sidebar").hasClass("toggled")) {
	}
});

// Close any open menu accordions when window is resized below 768px
$(window).resize(function () {
	if ($(window).width() < 768) {
	}

	// Toggle the side navigation when window is resized below 480px
	if ($(window).width() < 480 && !$(".sidebar").hasClass("toggled")) {
		$("body").addClass("sidebar-toggled");
		$(".sidebar").addClass("toggled");
	}
});

// Prevent the content wrapper from scrolling when the fixed side navigation hovered over
$("body.fixed-nav .sidebar").on(
	"mousewheel DOMMouseScroll wheel",
	function (e) {
		if ($(window).width() > 768) {
			var e0 = e.originalEvent,
				delta = e0.wheelDelta || -e0.detail;
			this.scrollTop += (delta < 0 ? 1 : -1) * 30;
			e.preventDefault();
		}
	}
);

// Scroll to top button appear
$(document).on("scroll", function () {
	var scrollDistance = $(this).scrollTop();
	if (scrollDistance > 100) {
		$(".scroll-to-top").fadeIn();
	} else {
		$(".scroll-to-top").fadeOut();
	}
});

// Smooth scrolling using jQuery easing
$(document).on("click", "a.scroll-to-top", function (e) {
	var $anchor = $(this);
	$("html, body")
		.stop()
		.animate(
			{
				scrollTop: $($anchor.attr("href")).offset().top,
			},
			1000,
			"easeInOutExpo"
		);
	e.preventDefault();
});

const links = [
	{
		name: "Activos | Plaqueados",
		href: "/plaqueados/",
	},
	{
		name: "Activos | No Plaqueados",
		href: "/no-plaqueados/",
	},
	{
		name: "Activos | Tipos",
		href: "/tipo/",
	},
	{
		name: "Activos | Subtipos",
		href: "/subtipo/",
	},
	{
		name: "Activos | Compra",
		href: "/compra/",
	},
	{
		name: "Trámites | Traslado",
		href: "/generar/traslados",
	},
	{
		name: "Trámites | Deshecho",
		href: "/generar/desecho",
	},
	{
		name: "Trámites | Ver Trámites",
		href: "/tramites",
	},
	{
		name: "Reportes | Plaqueados",
		href: "/reportes/plaqueados",
	},
	{
		name: "Reportes | No Plaqueados",
		href: "/reportes/no-plaqueados",
	},

	{
		name: "Reportes | Plaqueados 2 años",
		href: "/reportes/plaqueados/2-old",
	},
	{
		name: "Reportes | Plaqueados 4 años",
		href: "/reportes/plaqueados/4-old",
	},
	{
		name: "Reportes | No Plaqueados 2 años",
		href: "/reportes/no-plaqueados/2-old",
	},
	{
		name: "Reportes | No Plaqueados 4 años",
		href: "/reportes/no-plaqueados/4-old",
	},
	{
		name: "Gestión | Funcionarios",
		href: "/funcionarios",
	},
	{
		name: "Gestión | Ubicaciones",
		href: "/ubicaciones",
	},
	{
		name: "Gestión | Usuarios",
		href: "/users",
	},
	{
		name: "Importar | Plaqueados",
		href: "/importar/activos",
	},
	{
		name: "Importar | No Plaqueados",
		href: "/importar/no-plaqueados",
	},
	{
		name: "Importar | Reporte Plaqueados",
		href: "/importar/reporte-plaqueados",
	},
];

$(".content")
	.not($("#nav-search-input"))
	.on("click", () => {
		$(".search-result-container").toggleClass("hidden", true);
	});

$("#nav-search-input").on("click", (event) => {
	if ($(".search-result-list").children(".search-result-item").length > 0) {
		$(".search-result-container").toggleClass("hidden", false);
	}
});
$("#nav-search-input").on("keyup", (event) => {
	const value = event.target.value.trim().toLowerCase();
	const container = $(".search-result-container");

	const similarLinks = links
		.filter((link) => link.name.toLowerCase().includes(value))
		.slice(0, 4);
	if (value === "" || similarLinks.length === 0) {
		container.toggleClass("hidden", true);
		return;
	}

	const template = $("#search-item-template");
	const list = $(".search-result-list");
	const children = list.children(".search-result-item");
	children.remove();
	similarLinks.forEach((link) => {
		const content = template[0].content.cloneNode(true);
		const a = content.querySelector(".result-link");
		a.text = link.name;
		a.href = link.href;
		list.append(content);
	});

	container.toggleClass("hidden", false);
});
