import React, {useCallback, useState} from "react"
import {DistanceMatrixService, GoogleMap, InfoWindow, Marker, useLoadScript} from "@react-google-maps/api"
import {getGeocode} from "use-places-autocomplete"

import "./App.css"
import {Row} from "./Row"

//Settings for map component
const libraries = ["places"]
const center = {
	lat: 53.709808,
	lng: 27.953388,
}
const mapContainerStyle = {
	height: "100vh",
	width: "100%",
}
const options = {
	disableDefaultUI: true,
	disableDoubleClickZoom: true,
	zoomControl: true,
}

function App () {
	const {isLoaded, loadError} = useLoadScript({
		googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
		libraries,
	})
	const mapRef = React.useRef()
	const onMapLoad = React.useCallback((map) => {
		mapRef.current = map
	}, [])

	//State
	const [coordinates, setCoordinates] = useState({
		lat: "",
		lng: "",
	})
	const [activeResult, setActiveResult] = useState({})
	const [results, setResults] = useState([])

	//Receiving coordinates from click
	const getCoordinates = useCallback((e) => {
		setCoordinates({
			lat: (parseInt(e.latLng.lat() * 1000000)) / 1000000,
			lng: (parseInt(e.latLng.lng() * 1000000)) / 1000000,
		})
		setActiveResult(null)
	}, [])

	//Receiving geocoding request
	const getGeocodingAPI = async (location) => {
		try {
			const data = await getGeocode(location)
			return data[0].formatted_address
		} catch (error) {
			console.error("Ошибка при выполнении геокодинга", error)
		}
	}

	//Display result after geocoding
	const onGeocodingButtonClick = useCallback(() => {
		setActiveResult(null)
		getGeocodingAPI({location: coordinates})
		.then(address => {
			const activeResult = {
				lat: coordinates.lat,
				lng: coordinates.lng,
				address: address,
				distance: 0,
			}
			// console.log(activeResult)
			setResults((current) => [
				...current,
				activeResult,
			])
			setActiveResult(activeResult)
		})
	}, [coordinates])

	//Receiving distance between last 2 points
	const getDistance = useCallback((destination, distance) => {
		setResults((current) => current.map(c => {
				if (c.address === destination) {
					return {
						...c,
						distance: distance,
					}
				} else return c
			}),
		)
	}, [])

	//Receiving options for distance request
	const getOptions = useCallback(() => {
		if (results.length > 1) {
			return {
				origins: [{
					lat: results[results.length - 2].lat,
					lng: results[results.length - 2].lng,
				}],
				destinations: [{
					lat: results[results.length - 1].lat,
					lng: results[results.length - 1].lng,
				}],
				travelMode: "DRIVING",
			}
		} else return null
	}, [results])

	const renderMap = () => {
		return (
			<div className="App">

				<div className="history">
					<Row lat={"Широта"}
						 lng={"Долгота"}
						 address={"Адрес"}
						 distance={"Расстояние от последней точки"}/>

					{
						results.map((res, i) => <Row key={i}
															 lat={res.lat}
															 lng={res.lng}
															 address={res.address}
															 distance={res.distance}/>)
					}

					<div className="total_distance">
						Общее расстояние: {
						results.map(r => parseInt(r.distance))
						.reduce((sum, curr) => sum + curr, 0)
					} км
					</div>
				</div>

				<div className="geocode">
					<input type="text"
						   placeholder="широта"
						   readOnly
						   value={coordinates.lat}
					/>
					<input type="text"
						   placeholder="долгота"
						   readOnly
						   value={coordinates.lng}
					/>
					<button className="geocode_button"
							onClick={onGeocodingButtonClick}>
						Геокодировать
					</button>
				</div>

				<GoogleMap center={center}
						   mapContainerStyle={mapContainerStyle}
						   options={options}
						   zoom={7}
						   onDblClick={getCoordinates}
						   onLoad={onMapLoad}>

					<Marker position={coordinates}>
						{
							activeResult ? (<InfoWindow onCloseClick={() => setActiveResult(null)}>
								<div>
									{
										activeResult.address
									}
								</div>
							</InfoWindow>) : null
						}
					</Marker>

					{
						results.length > 1 ? (
							<DistanceMatrixService options={getOptions()}
												   callback={(response, status) => {
													   if (status === "OK") {
														   getDistance(response.destinationAddresses[0], response.rows[0].elements[0].distance.text)
														   // console.log("Расстояние: ", response.rows[0].elements[0].distance.text)
														   // console.log("Ответ: ", response)
													   } else console.log(status)
												   }}/>
						) : null
					}
				</GoogleMap>
			</div>
		)
	}

	if (loadError) {
		return (
			<div>Карта сейчас не может быть загружена.</div>
		)
	}
	return isLoaded ? renderMap() : <div>Загрузка карты.</div>
}

export default App
