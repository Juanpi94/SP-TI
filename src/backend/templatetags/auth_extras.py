from django import template

register = template.Library()


@register.filter(name="has_group")
def has_group(user, group_name):
    return user.groups.filter(name=group_name).exists()


@register.filter(name="can_write")
def can_write(user):

    return user.has_perm("backend.escritura")


@register.filter(name="can_read")
def can_read(user):
    return user.has_perm("backend.lectura")
