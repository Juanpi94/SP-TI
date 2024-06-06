from ast import arg


class ArgMissingException(Exception):
    def __init__(self, *args, message="There are arguments left: ") -> None:
        args_left = ", ".join(args)
        self.message = message + " " + args_left
        super().__init__(self.message)
