from typing import TypedDict
from enum import Enum


class HorizontalAligns(Enum):
    left = "left",
    center = "center",
    right = "right",


class VerticalAligns(Enum):
    top = "top",
    middle = "middle",
    bottom = "bottom",


class ColumnDefs(TypedDict, total=False):
    title: str
    field: str
    visible: bool
    hozAlign: HorizontalAligns
    vertAlign: VerticalAligns
    headerHozAlign: HorizontalAligns
    width: str
    minWidth: str
    maxWidth: str
    headerSort: bool
