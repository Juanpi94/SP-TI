from backend import models
from backend.custom_types import ImportResult
from backend.models import Activos_No_Plaqueados, Activos_Plaqueados, Compra, Proveedor
from backend.utils import dateutils
from django.db import DataError, IntegrityError
from pandas import isna


class ImportModule:
    """
    This class helps with importing data from an Excel file
    """

    @staticmethod
    def import_activos(data: list, update: bool) -> ImportResult:
        """
        :param data:
        :param update: whether to update already existing entries or not
        :return: The result of the import
        """
        details: ImportResult = {
            "total": 0,
            "created": 0,
            "omitted": 0,
            "failed": 0,
            "errors": [],
        }
        for idx, row in enumerate(data):
            assert len(row) == 18, "Se envio una cantidad incorrecta de datos " + str(
                len(row)
            )

            row_number = idx + 2
            [
                placa,
                zona,
                nombre,
                tipo,
                subtipo,
                marca,
                modelo,
                serie,
                valor,
                garantia,
                detalle,
                custodio,
                unidad,
                coordinador,
                ubicacion,
                estado,
                registro_fecha,
                compra,
            ] = row
            placa = str(placa) if isinstance(placa, int) else placa
            if isna(placa):
                details["failed"] += 1
                details["errors"].append(f"Placa vacia en fila {row_number}")
                continue

            garantia = (
                None if isna(garantia) else dateutils.try_parse_date(str(garantia))
            )
            registro_fecha = (
                None
                if isna(registro_fecha)
                else dateutils.try_parse_date(str(registro_fecha))
            )
            qs = Activos_Plaqueados.objects.filter(placa=placa)
            if qs.count() > 1 and update:
                activo = qs[0]
            elif qs.count() > 1:
                details["omitted"] += 1
                continue
            else:
                activo = Activos_Plaqueados(
                    placa=placa,
                    nombre=nombre,
                    observacion=detalle,
                    valor=valor,
                    serie=serie,
                    marca=marca,
                    modelo=modelo,
                    garantia=garantia,
                    estado=estado,
                    fecha_registro=registro_fecha,
                )
            if not isna(tipo) and tipo.strip():
                tipo_db, _ = models.Tipo.objects.get_or_create(
                    defaults={"detalle": ""}, nombre=tipo
                )

                activo.tipo = tipo_db

            if not isna(subtipo) and subtipo.strip():
                subtipo_db, _ = models.Subtipo.objects.get_or_create(
                    defaults={"detalle": ""}, nombre=subtipo
                )
                activo.subtipo = subtipo_db
            if not isna(ubicacion) and ubicacion.strip():
                instalacion = (
                    models.Ubicaciones.InstalacionChoices.ESPARZA
                    if zona.lower() == "nances-esparza"
                    else models.Ubicaciones.InstalacionChoices.COCAL
                )
                if not isna(custodio) and custodio.strip():
                    custodio, _ = models.Funcionarios.objects.get_or_create(
                        defaults={"cedula": ""}, nombre_completo=custodio
                    )
                    ubicacion_db, _ = models.Ubicaciones.objects.get_or_create(
                        defaults={"instalacion": instalacion, "custodio": custodio},
                        ubicacion=ubicacion,
                    )
                    activo.ubicacion = ubicacion_db
            if not isna(compra):
                compra = Compra.objects.filter(numero_orden_compra=compra)
                if compra.count() > 0:
                    activo.compra = compra[0]
            try:
                activo.save()
                details["created"] += 1
            except DataError as e:
                print(detalle)
                details["failed"] += 1
                details["errors"].append(
                    f"Un activo contiene un campo mal formateado en fila {row_number}\n{e.__str__()}"
                )
            except IntegrityError as e:
                details["failed"] += 1
                details["errors"].append(
                    f"Un campo no cumple con una clausula de la base de datos en fila {row_number}\n{e.__str__()}"
                )
            except Exception as e:
                details["failed"] += 1
                details["errors"].append(
                    f"No se pudo guardar el activo en fila {row_number}\n{e.__str__()}"
                )
        return details

    @staticmethod
    def import_no_plaqueados(data: list, update: bool):
        """
        :param data:
        :param update: whether to update already existing entries or not
        :return: The result of the import
        """
        details: ImportResult = {
            "total": 0,
            "created": 0,
            "omitted": 0,
            "failed": 0,
            "errors": [],
        }
        for idx, row in enumerate(data):
            assert len(row) == 17, "Se envio una cantidad incorrecta de datos " + str(
                len(row)
            )

            row_number = idx + 2
            [
                zona,
                nombre,
                tipo,
                subtipo,
                marca,
                modelo,
                serie,
                valor,
                garantia,
                detalle,
                custodio,
                unidad,
                coordinador,
                ubicacion,
                estado,
                registro_fecha,
                compra,
            ] = row

            placa = str(placa)
            if isna(serie):
                details["failed"] += 1
                details["errors"].append(
                    f"Activo no plaqueado sin serie en fila {row_number}"
                )
                continue
            details["total"] += 1
            garantia = (
                None if isna(garantia) else dateutils.try_parse_date(str(garantia))
            )
            registro_fecha = (
                None
                if isna(registro_fecha)
                else dateutils.try_parse_date(str(registro_fecha))
            )
            qs = Activos_No_Plaqueados.objects.filter(placa=placa)
            if qs.count() > 1 and update:
                activo = qs[0]
            elif qs.count() > 1:
                details["omitted"] += 1
                continue
            else:
                activo = Activos_No_Plaqueados(
                    placa=placa,
                    nombre=nombre,
                    observacion=detalle,
                    valor=valor,
                    serie=serie,
                    marca=marca,
                    modelo=modelo,
                    garantia=garantia,
                    estado=estado,
                    fecha_registro=registro_fecha,
                )
            if not isna(tipo):
                tipo_db, _ = models.Tipo.objects.get_or_create(
                    defaults={"detalle": ""}, nombre=tipo
                )

                activo.tipo = tipo_db

            if not isna(subtipo):
                subtipo_db, _ = models.Subtipo.objects.get_or_create(
                    defaults={"detalle": ""}, nombre=subtipo
                )
                activo.subtipo = subtipo_db
            if not isna(ubicacion):
                instalacion = (
                    models.Ubicaciones.InstalacionChoices.ESPARZA
                    if zona.lower() == "nances-esparza"
                    else models.Ubicaciones.InstalacionChoices.COCAL
                )
                if not isna(custodio) and custodio.strip():
                    custodio, _ = models.Funcionarios.objects.get_or_create(
                        defaults={"cedula": ""}, nombre_completo=custodio
                    )
                    ubicacion_db, _ = models.Ubicaciones.objects.get_or_create(
                        defaults={"instalacion": instalacion, "custodio": custodio},
                        ubicacion=ubicacion,
                    )
                    activo.ubicacion = ubicacion_db
            if not isna(compra):
                compra = Compra.objects.filter(numero_orden_compra=compra)
                if compra.count() > 0:
                    activo.compra = compra[0]
            try:
                activo.save()
                details["created"] += 1
            except DataError as e:
                details["failed"] += 1
                details["errors"].append(
                    f"Un activo contiene un campo mal formateado en fila {row_number}\n{e.__str__()}"
                )
            except IntegrityError as e:
                details["failed"] += 1
                details["errors"].append(
                    f"Un campo no cumple con una clausula de la base de datos en fila {row_number}\n{e.__str__()}"
                )
            except Exception as e:
                details["failed"] += 1
                details["errors"].append(
                    f"No se pudo guardar el activo en fila {row_number}\n{e.__str__()}"
                )
        return details

    @staticmethod
    def import_compras(data: list, update: bool) -> ImportResult:
        details: ImportResult = {
            "total": 0,
            "created": 0,
            "omitted": 0,
            "failed": 0,
            "errors": [],
        }

        for idx, row in enumerate(data):
            assert len(row) == 11, "Se envió una cantidad incorrecta de datos " + str(
                len(row)
            )
            row_idx = idx + 2

            [
                numero_compra,
                origen_presupuesto,
                decision,
                solicitud,
                procedimiento,
                factura,
                proveedor,
                telefono_proveedor,
                correo_proveedor,
                detalle,
                informe,
            ] = row

            qs = Compra.objects.filter(numero_orden_compra=numero_compra)

            details["total"] += 1
            if qs.count() > 0 and not update:
                details["omitted"] += 1
                continue
            elif qs.count() > 0:
                compra = qs[0]
            else:
                compra = Compra(
                    numero_orden_compra=numero_compra,
                    origen_presupuesto=origen_presupuesto,
                    decision_inicial=decision,
                    numero_solicitud=solicitud,
                    numero_procedimiento=procedimiento,
                    numero_factura=factura,
                    detalle=detalle,
                    informe_tecnico=informe,
                )

            if not isna(proveedor):
                proveedor, _ = Proveedor.objects.get_or_create(
                    nombre=proveedor,
                    defaults={
                        "telefono": telefono_proveedor,
                        "correo": correo_proveedor,
                    },
                )
                compra.proveedor = proveedor

            try:
                compra.save()
                details["created"] += 1
            except DataError as e:
                details["failed"] += 1
                details["errors"].append(
                    f"Una compra contiene un campo mal formateado en fila {row_idx}\n{e.__str__()}"
                )
            except IntegrityError as e:
                details["failed"] += 1
                details["errors"].append(
                    f"Un campo no cumple con una clausula de la base de datos en fila {row_idx}\n{e.__str__()}"
                )
            except Exception as e:
                details["failed"] += 1
                details["errors"].append(
                    f"No se pudo guardar la compra en fila {row_idx}\n{e.__str__()}"
                )
        return details
