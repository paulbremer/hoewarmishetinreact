import React, { Component } from 'react';
import axios from 'axios';
import Flickr from 'flickr-sdk';
import './App.css';

class App extends Component {
    state = {
        tempText: 'Op zoek naar de zon...',
        backgroundImageURI: '',
        temperature: '',
    }

    componentDidMount() {
        const flickrApiKey = '4b82a5422b18968ea142a50cd9941398';
        const flickr =  Flickr(flickrApiKey);

        const locationSuccess = (position) => {
            axios.get(`https://cors-anywhere.herokuapp.com/https://openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=b6907d289e10d714a6e88b30761fae22`)
                .then(res => {
                    const weather = res.data;
                    const temp = res.data.main.temp;

                    this.setState({ temperature: Math.floor(temp) });
                    addWeather(temp);
                    addBackgroundPhoto(weather);
                });
        }

        const locationError = (error) => {
            console.error('STUK locationError', error);
        }

        const addWeather = (temp) => {
            if (temp < 11) {
                this.setState({ tempText: 'helemaal niet warm' });
            } else if (temp < 16) {
                this.setState({ tempText: 'niet echt warm' });
            } else if (temp < 19) {
                this.setState({ tempText: 'beetje warm' });
            } else if (temp < 24) {
                this.setState({ tempText: 'aardig warm' });
            } else if (temp < 28) {
                this.setState({ tempText: 'warm' });
            } else if (temp < 32) {
                this.setState({ tempText: 'erg warm' });
            } else if (temp < 36) {
                this.setState({ tempText: 'heel erg warm' });
            } else if (temp > 35) {
                this.setState({ tempText: 'ontzettend warm' });
            } else {
                this.setState({ tempText: 'wij zijn de zon kwijt' });
            }
        }

        const addBackgroundPhoto = (weather) => {
            flickr.photos.search({
                text: `${weather.name} ${weather.weather.main}`
            }).then((res) => {
                const randomNumber = Math.floor(Math.random() * (res.body.photos.photo.length));
                const firstPhotoId = res.body.photos.photo[randomNumber].id;

                flickr.photos.getSizes({
                    photo_id: firstPhotoId
                }).then((result) => {
                    this.setState({ backgroundImageURI: result.body.sizes.size[result.body.sizes.size.length - 2].source });
                }).catch((err) => {
                    console.error('STUK', err);
                });
            }).catch((err) => {
                console.error('STUK', err);
            });
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
        } else {
            console.error('Je browser kan de zon niet zien!');
            this.setState({ tempText: 'wij zijn de zon kwijt' });
        }
    }

    render() {
        return (
            <div className="app wrapper">
                <div className="background" style={{backgroundImage: `url(${this.state.backgroundImageURI})`, opacity: this.state.backgroundImageURI === '' ? 0 : 1}} />
                <header>
                    <h1 className="title">Hoe warm is het vandaag?</h1>
                </header>
                <main>
                    <div className="degree" style={{opacity: this.state.temperature === '' ? 0 : 1}}>{this.state.temperature}°</div>
                    <p className="warmth">
                        { this.state.tempText }
                    </p>
                </main>
                <footer className="bottom">
                    <div className="social">
                        <div className="fb-page" data-href="https://www.facebook.com/hoewarmishetvandaag/" data-small-header="true" data-adapt-container-width="false" data-hide-cover="false" data-show-facepile="false">
                            <div className="fb-xfbml-parse-ignore"><blockquote cite="https://www.facebook.com/hoewarmishetvandaag/">
                                <a href="https://www.facebook.com/hoewarmishetvandaag/">Hoe warm is het vandaag?</a></blockquote>
                            </div>
                        </div>
                    </div>

                    <div>een project van <a href="https://twitter.com/#!/petergerdes" target="_blank" rel="noopener noreferrer">@petergerdes</a> en <a href="https://twitter.com/#!/paulbremer_" target="_blank" rel="noopener noreferrer">@paulbremer_</a> &copy; { (new Date().getFullYear()) }
                    </div>
                </footer>
            </div>
        );
    }
}

export default App;
