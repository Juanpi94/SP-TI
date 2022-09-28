const toggleBtn = $(".toggle-btn");
const navPills = $(".nav-pills");
const nav = $("nav");
const logo = $(".logo span");

toggleBtn.on("click", () => {
	const isToggled = nav.css("transform") === "none";
	if (isToggled) {
		nav.css("transform", "translate(-215px)");
		return;
	}

	nav.css("transform", "none");
});
