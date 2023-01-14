import { axiosInstance, Err, Success } from "./utils";

const passwordInput = $("#password");
const repeatedPasswordInput = $("#repeat-password");
const submitBtn = $("#submit-btn");

submitBtn.on("click", () => {
	const password = passwordInput.val();
	const repeatedPassword = repeatedPasswordInput.val();

	passwordInput.setValid();
	repeatedPasswordInput.setValid();
	const isPasswordValid = passwordInput.isValid();
	const isRepeatedValid = repeatedPasswordInput.isValid();

	if (isPasswordValid) {
		if (isRepeatedValid) {
			console.log(password !== repeatedPassword, password, repeatedPassword);
			if (password !== repeatedPassword) {
				repeatedPasswordInput.setInvalid("Las contraseña repetida no coincide");
			} else {
				axiosInstance
					.post("/api/auth/change_password/", { password: password })
					.then((res) => {
						if (res.status === 202) {
							Success.fire("Se cambio la contraseña con éxito");
							bootstrap.Modal.getInstance($("#change-password-modal")).hide();
							return;
						}

						Err.fire("Error al cambiar la contraseña");
					});
			}
		} else {
			repeatedPasswordInput.setInvalid("Rellene el campo");
		}
	} else {
		passwordInput.setInvalid("Rellene el campo");
	}
});
