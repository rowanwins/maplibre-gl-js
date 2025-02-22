import LngLat from './lng_lat';
import type {LngLatLike} from './lng_lat';

/**
 * A `LngLatBounds` object represents a geographical bounding box,
 * defined by its southwest and northeast points in longitude and latitude.
 *
 * If no arguments are provided to the constructor, a `null` bounding box is created.
 *
 * Note that any Mapbox GL method that accepts a `LngLatBounds` object as an argument or option
 * can also accept an `Array` of two {@link LngLatLike} constructs and will perform an implicit conversion.
 * This flexible type is documented as {@link LngLatBoundsLike}.
 *
 * @param {LngLatLike} [sw] The southwest corner of the bounding box.
 * @param {LngLatLike} [ne] The northeast corner of the bounding box.
 * @example
 * var sw = new maplibregl.LngLat(-73.9876, 40.7661);
 * var ne = new maplibregl.LngLat(-73.9397, 40.8002);
 * var llb = new maplibregl.LngLatBounds(sw, ne);
 */
class LngLatBounds {
    _ne: LngLat;
    _sw: LngLat;

    /**
     * @param {LngLatLike} [sw] The southwest corner of the bounding box.
     * OR array of 4 numbers in the order of  west, south, east, north
     * OR array of 2 LngLatLike: [sw,ne]
     * @param {LngLatLike} [ne] The northeast corner of the bounding box.
     * @example
     * var sw = new maplibregl.LngLat(-73.9876, 40.7661);
     * var ne = new maplibregl.LngLat(-73.9397, 40.8002);
     * var llb = new maplibregl.LngLatBounds(sw, ne);
     * OR
     * var llb = new maplibregl.LngLatBounds([-73.9876, 40.7661, -73.9397, 40.8002]);
     * OR
     * var llb = new maplibregl.LngLatBounds([sw, ne]);
     */
    constructor(sw?: LngLatLike | [number, number, number, number] | [LngLatLike, LngLatLike], ne?: LngLatLike) {
        if (!sw) {
            // noop
        } else if (ne) {
            this.setSouthWest(<LngLatLike>sw).setNorthEast(ne);
        } else if (Array.isArray(sw)) {
            if (sw.length === 4) {
            // 4 element array: west, south, east, north
                this.setSouthWest([sw[0], sw[1]]).setNorthEast([sw[2], sw[3]]);
            } else {
                this.setSouthWest(sw[0] as LngLatLike).setNorthEast(sw[1] as LngLatLike);
            }
        }
    }

    /**
     * Set the northeast corner of the bounding box
     *
     * @param {LngLatLike} ne a {@link LngLatLike} object describing the northeast corner of the bounding box.
     * @returns {LngLatBounds} `this`
     */
    setNorthEast(ne: LngLatLike) {
        this._ne = ne instanceof LngLat ? new LngLat(ne.lng, ne.lat) : LngLat.convert(ne);
        return this;
    }

    /**
     * Set the southwest corner of the bounding box
     *
     * @param {LngLatLike} sw a {@link LngLatLike} object describing the southwest corner of the bounding box.
     * @returns {LngLatBounds} `this`
     */
    setSouthWest(sw: LngLatLike) {
        this._sw = sw instanceof LngLat ? new LngLat(sw.lng, sw.lat) : LngLat.convert(sw);
        return this;
    }

    /**
     * Extend the bounds to include a given LngLatLike or LngLatBoundsLike.
     *
     * @param {LngLatLike|LngLatBoundsLike} obj object to extend to
     * @returns {LngLatBounds} `this`
     */
    extend(obj: LngLatLike | LngLatBoundsLike) {
        const sw = this._sw,
            ne = this._ne;
        let sw2, ne2;

        if (obj instanceof LngLat) {
            sw2 = obj;
            ne2 = obj;

        } else if (obj instanceof LngLatBounds) {
            sw2 = obj._sw;
            ne2 = obj._ne;

            if (!sw2 || !ne2) return this;

        } else {
            if (Array.isArray(obj)) {
                if (obj.length === 4 || (obj as any[]).every(Array.isArray)) {
                    const lngLatBoundsObj = (obj as any as LngLatBoundsLike);
                    return this.extend(LngLatBounds.convert(lngLatBoundsObj));
                } else {
                    const lngLatObj = (obj as any as LngLatLike);
                    return this.extend(LngLat.convert(lngLatObj));
                }

            } else if (obj && ('lng' in obj || 'lon' in obj) && 'lat' in obj) {
                return this.extend(LngLat.convert(obj));
            }

            return this;
        }

        if (!sw && !ne) {
            this._sw = new LngLat(sw2.lng, sw2.lat);
            this._ne = new LngLat(ne2.lng, ne2.lat);

        } else {
            sw.lng = Math.min(sw2.lng, sw.lng);
            sw.lat = Math.min(sw2.lat, sw.lat);
            ne.lng = Math.max(ne2.lng, ne.lng);
            ne.lat = Math.max(ne2.lat, ne.lat);
        }

        return this;
    }

    /**
     * Returns the geographical coordinate equidistant from the bounding box's corners.
     *
     * @returns {LngLat} The bounding box's center.
     * @example
     * var llb = new maplibregl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getCenter(); // = LngLat {lng: -73.96365, lat: 40.78315}
     */
    getCenter(): LngLat {
        return new LngLat((this._sw.lng + this._ne.lng) / 2, (this._sw.lat + this._ne.lat) / 2);
    }

    /**
     * Returns the southwest corner of the bounding box.
     *
     * @returns {LngLat} The southwest corner of the bounding box.
     */
    getSouthWest(): LngLat { return this._sw; }

    /**
     * Returns the northeast corner of the bounding box.
     *
     * @returns {LngLat} The northeast corner of the bounding box.
     */
    getNorthEast(): LngLat { return this._ne; }

    /**
     * Returns the northwest corner of the bounding box.
     *
     * @returns {LngLat} The northwest corner of the bounding box.
     */
    getNorthWest(): LngLat { return new LngLat(this.getWest(), this.getNorth()); }

    /**
     * Returns the southeast corner of the bounding box.
     *
     * @returns {LngLat} The southeast corner of the bounding box.
     */
    getSouthEast(): LngLat { return new LngLat(this.getEast(), this.getSouth()); }

    /**
     * Returns the west edge of the bounding box.
     *
     * @returns {number} The west edge of the bounding box.
     */
    getWest(): number { return this._sw.lng; }

    /**
     * Returns the south edge of the bounding box.
     *
     * @returns {number} The south edge of the bounding box.
     */
    getSouth(): number { return this._sw.lat; }

    /**
     * Returns the east edge of the bounding box.
     *
     * @returns {number} The east edge of the bounding box.
     */
    getEast(): number { return this._ne.lng; }

    /**
     * Returns the north edge of the bounding box.
     *
     * @returns {number} The north edge of the bounding box.
     */
    getNorth(): number { return this._ne.lat; }

    /**
     * Returns the bounding box represented as an array.
     *
     * @returns {Array<Array<number>>} The bounding box represented as an array, consisting of the
     * southwest and northeast coordinates of the bounding represented as arrays of numbers.
     * @example
     * var llb = new maplibregl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.toArray(); // = [[-73.9876, 40.7661], [-73.9397, 40.8002]]
     */
    toArray() {
        return [this._sw.toArray(), this._ne.toArray()];
    }

    /**
     * Return the bounding box represented as a string.
     *
     * @returns {string} The bounding box represents as a string of the format
     * `'LngLatBounds(LngLat(lng, lat), LngLat(lng, lat))'`.
     * @example
     * var llb = new maplibregl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.toString(); // = "LngLatBounds(LngLat(-73.9876, 40.7661), LngLat(-73.9397, 40.8002))"
     */
    toString() {
        return `LngLatBounds(${this._sw.toString()}, ${this._ne.toString()})`;
    }

    /**
     * Check if the bounding box is an empty/`null`-type box.
     *
     * @returns {boolean} True if bounds have been defined, otherwise false.
     */
    isEmpty() {
        return !(this._sw && this._ne);
    }

    /**
     * Check if the point is within the bounding box.
     *
     * @param {LngLatLike} lnglat geographic point to check against.
     * @returns {boolean} True if the point is within the bounding box.
     * @example
     * var llb = new maplibregl.LngLatBounds(
     *   new maplibregl.LngLat(-73.9876, 40.7661),
     *   new maplibregl.LngLat(-73.9397, 40.8002)
     * );
     *
     * var ll = new maplibregl.LngLat(-73.9567, 40.7789);
     *
     * console.log(llb.contains(ll)); // = true
     */
    contains(lnglat: LngLatLike) {
        const {lng, lat} = LngLat.convert(lnglat);

        const containsLatitude = this._sw.lat <= lat && lat <= this._ne.lat;
        let containsLongitude = this._sw.lng <= lng && lng <= this._ne.lng;
        if (this._sw.lng > this._ne.lng) { // wrapped coordinates
            containsLongitude = this._sw.lng >= lng && lng >= this._ne.lng;
        }

        return containsLatitude && containsLongitude;
    }

    /**
     * Converts an array to a `LngLatBounds` object.
     *
     * If a `LngLatBounds` object is passed in, the function returns it unchanged.
     *
     * Internally, the function calls `LngLat#convert` to convert arrays to `LngLat` values.
     *
     * @param {LngLatBoundsLike} input An array of two coordinates to convert, or a `LngLatBounds` object to return.
     * @returns {LngLatBounds} A new `LngLatBounds` object, if a conversion occurred, or the original `LngLatBounds` object.
     * @example
     * var arr = [[-73.9876, 40.7661], [-73.9397, 40.8002]];
     * var llb = maplibregl.LngLatBounds.convert(arr);
     * llb;   // = LngLatBounds {_sw: LngLat {lng: -73.9876, lat: 40.7661}, _ne: LngLat {lng: -73.9397, lat: 40.8002}}
     */
    static convert(input: LngLatBoundsLike | null): LngLatBounds {
        if (input instanceof LngLatBounds) return input;
        if (!input) return input as null;
        return new LngLatBounds(input);
    }

    /**
     * Returns a `LngLatBounds` from the coordinates extended by a given `radius`. The returned `LngLatBounds` completely contains the `radius`.
     *
     * @param center center coordinates of the new bounds.
     * @param {number} [radius=0] Distance in meters from the coordinates to extend the bounds.
     * @returns {LngLatBounds} A new `LngLatBounds` object representing the coordinates extended by the `radius`.
     * @example
     * var center = new maplibregl.LngLat(-73.9749, 40.7736);
     * maplibregl.LngLatBounds.fromLngLat(100).toArray(); // = [[-73.97501862141328, 40.77351016847229], [-73.97478137858673, 40.77368983152771]]
     */
    static fromLngLat(center: LngLat, radius:number = 0): LngLatBounds {
        const earthCircumferenceInMetersAtEquator = 40075017;
        const latAccuracy = 360 * radius / earthCircumferenceInMetersAtEquator,
            lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * center.lat);

        return new LngLatBounds(new LngLat(center.lng - lngAccuracy, center.lat - latAccuracy),
            new LngLat(center.lng + lngAccuracy, center.lat + latAccuracy));
    }
}

/**
 * A {@link LngLatBounds} object, an array of {@link LngLatLike} objects in [sw, ne] order,
 * or an array of numbers in [west, south, east, north] order.
 *
 * @typedef {LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number]} LngLatBoundsLike
 * @example
 * var v1 = new maplibregl.LngLatBounds(
 *   new maplibregl.LngLat(-73.9876, 40.7661),
 *   new maplibregl.LngLat(-73.9397, 40.8002)
 * );
 * var v2 = new maplibregl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002])
 * var v3 = [[-73.9876, 40.7661], [-73.9397, 40.8002]];
 */
export type LngLatBoundsLike = LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number];

export default LngLatBounds;
