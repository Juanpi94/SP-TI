from django import template
from django.template.defaultfilters import stringfilter
register = template.Library()


@register.filter(name="strip_quotes")
@stringfilter
def strip_quotes_lower(string: str):
    return string.replace('"', '').replace("'", "").lower()


@register.filter(name="_and")
def _and(val, secondVal):
    print(secondVal)
    return val and secondVal


@register.filter(name="replace_spaces")
@stringfilter
def replace_splaces(val):
    return val.replace("_", " ")
