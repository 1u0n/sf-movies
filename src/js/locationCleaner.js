/**
 * Makes the location more readable, improving the geocode service's success rate
 * (original addresses from the DB are really messy)
 */
export function cleanLocation(location) {

    console.log(location);

    location = location.toLowerCase();

    //San Francisco Chronicle (901 Mission Street at 15th Street)
    if (location.indexOf('(') != -1 && location.indexOf(')') != -1)
        location = location.substring(location.indexOf('(') + 1, location.indexOf(')'));

    //Lands End Trail at Eagles Point/ Lincoln Golf Course
    //20th St and Illinois/Faxon St. and Kenwodd/Glenbrook at Mt. Springs
    //Pier 43 1/2
    //Sam Jordan's Bar and Grill, 4004 3rd st
    //Montgomery & Market Streets
    var aux;
    if (location.indexOf('/') != -1)
        aux = location.split('/');
    else if (location.indexOf(',') != -1)
        aux = location.split(',');
    else if (location.indexOf('&') != -1)
        aux = location.split('&');
    else if (location.indexOf(' and ') != -1)
        aux = location.split(' and ');
    if (aux) {
        var found = false;
        for (var i = 0; i < aux.length; i++) {
            if (aux[i].indexOf(' st') > 1 || aux[i].indexOf(' av') > 1 || aux[i].indexOf(' dr') > 1 || aux[i].indexOf(' sq') > 1 ||
                aux[i].indexOf(' at ') != -1 || aux[i].indexOf(' @ ') != -1 || aux[i].indexOf('from ') != -1) {
                found = true;
                location = aux[i];
                break;
            }
            if (!found)
                location = aux[0];
        }
    }

    //901 main street at 15th street
    if (location.indexOf(' at ') != -1)
        location = location.substring(location.indexOf(' at ') + 4);

    //Romolo Place @ Fresno St.
    if (location.indexOf(' @ ') != -1)
        location = location.substring(location.indexOf(' @ ') + 3);

    //Way Faire Inn on Leidesdorff
    if (location.indexOf(' on ') != -1)
        location = location.substring(location.indexOf(' on ') + 4);

    //Pier 45 - Jeremiah O'Brien Liberty Ship
    //Pier 50- end of the pier
    if (location.indexOf('- ') != -1)
        location = location.substring(0, location.indexOf('- '));

    //1158-70 Montgomery Street
    if (location.indexOf('-') != -1) {
        var aux = location.split('-');
        location = aux[0] + aux[1].substring(aux[1].indexOf(' '));
    }

    //Chestnut St. from Larkin to Columbus
    //Leavenworth from Filbert & Francisco St
    if (location.indexOf('from ') != -1)
        location = location.substring(0, location.indexOf('from '));

    //Laguna Honda Hospital; 375 Laguna
    if (location.indexOf('; ') != -1)
        location = location.substring(location.indexOf('; ') + 2);

    //Corner of Van Ness & Mission street
    if (location.indexOf('corner of ') != -1)
        location = location.substring(location.indexOf('corner of ') + 10);

    if (location.indexOf('intersection of ') != -1)
        location = location.substring(location.indexOf('intersection of ') + 16);

    if (location.indexOf('intersection between ') != -1)
        location = location.substring(location.indexOf('intersection between ') + 21);

    //Market between Stuart and Van Ness
    if (location.indexOf('between ') != -1)
        location = location.substring(0, location.indexOf('between '));

    //Park 77 (now called The Lister Bar), 77 Cambon Dr.
    if (location.indexOf('now called ') != -1)
        location = location.substring(location.indexOf('now called ') + 11);

    if (location.indexOf('streets') != -1)
        location = location.substring(0, location.indexOf('streets') + 6);

    console.log(location);

    return location;
}