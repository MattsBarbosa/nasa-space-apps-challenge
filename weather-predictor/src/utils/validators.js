export function validateCoordinates(lat, lon) {
    if (
        isNaN(lat) ||
        isNaN(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
    ) {
        return { valid: false, error: "Coordenadas inválidas" };
    }
    return { valid: true };
}

export function validateDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return { valid: false, error: "Data inválida. Use YYYY-MM-DD" };
    }

    const maxFuture = new Date();
    maxFuture.setFullYear(maxFuture.getFullYear() + 30);

    if (date > maxFuture) {
        return { valid: false, error: "Data muito distante (máximo 2 anos)" };
    }

    return { valid: true };
}
