import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class App extends Component {
    state = {
        main: {
            temp: 0
        },
        tempText: 'Op zoek naar de zon...'
    }

    componentDidMount() {
        const locationSuccess = (position) => {
            console.log('locationSuccess', position.coords);

            axios.get(`https://cors-anywhere.herokuapp.com/https://openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=b6907d289e10d714a6e88b30761fae22`)
                .then(res => {
                    const weather = res.data;
                    const temp = res.data.main.temp;
                    this.setState(weather);
                    addWeather(temp);

                    console.log(weather);
                });
        }

        const locationError = (error) => {
            console.log('locationError', error);
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
                <header>
                    <h1 className="title">Hoe warm is het vandaag?</h1>
                </header>
                <main>
                    <p id="warmte">
                        { this.state.tempText }
                    </p>
                </main>
                <footer className="bottom">
                    <div className="downloads">
                        <div id="android">
                            <a href="http://play.google.com/store/apps/details?id=com.phonegap.hoewarmishet" target="_blank">
                            <img alt="Android app on Google Play" src="https://www.android.com/images/brand/android_app_on_play_logo_small.png" /></a>
                        </div>
                    </div>
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
