import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface TrashProps {
    x: number;
    y: number;
}

const Trash = ({ x, y }: TrashProps) => {
    return <View style={[styles.trash, { left: x, top: y }]} />;
};

const GameScreen = () => {
    const [score, setScore] = useState(0);
    const [characterPosition, setCharacterPosition] = useState({ x: width / 2, y: height - 100 });
    const [trash, setTrash] = useState<Array<TrashProps>>([]);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        const loadSound = async () => {
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/BJMO.mp3'), // Asegúrate de tener la canción en la carpeta assets
                { shouldPlay: true }
            );
            setSound(sound);

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPaused(true);
                    Alert.alert(
                        "Juego Terminado",
                        "La canción ha terminado. Volver al menú principal.",
                        [
                            {
                                text: "OK",
                                onPress: () => navigation.navigate('Home' as never),
                            },
                        ],
                        { cancelable: false }
                    );
                }
            });
        };

        loadSound();

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            const resumeSound = async () => {
                if (sound && !isPaused) {
                    await sound.playAsync();
                }
            };

            const pauseSound = async () => {
                if (sound) {
                    await sound.pauseAsync();
                }
            };

            resumeSound();

            return () => {
                pauseSound();
            };
        }, [sound, isPaused])
    );

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            const newTrash = { x: Math.random() * width, y: 0 };
            setTrash((prevTrash) => [...prevTrash, newTrash]);
        }, 1500);

        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setTrash((prevTrash) =>
                prevTrash.map((item) => ({ ...item, y: item.y + 5 })) // Incrementa la velocidad de caída aquí
            );
        }, 50); // Mantén el intervalo de tiempo aquí

        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setTrash((prevTrash) => {
                const newTrash = prevTrash.filter((item) => {
                    const isCaught =
                        Math.abs(item.x - characterPosition.x) < 50 &&
                        Math.abs(item.y - characterPosition.y) < 50;
                    if (isCaught) {
                        setScore((prevScore) => prevScore + 1);
                    }
                    return !isCaught;
                });

                // Si algún objeto de basura llega al fondo de la pantalla, el jugador falla
                const hasFailed = prevTrash.some(item => item.y > height);
                if (hasFailed && !isPaused) {
                    setIsPaused(true);
                    setHasFailed(true);
                    if (sound) {
                        sound.stopAsync();
                    }
                    Alert.alert(
                        "Juego Pausado",
                        "¿Quieres continuar?",
                        [
                            {
                                text: "No",
                                onPress: () => navigation.navigate('Home' as never),
                                style: "cancel"
                            },
                            {
                                text: "Sí",
                                onPress: () => {
                                    setIsPaused(false);
                                    setHasFailed(false);
                                    if (sound) {
                                        sound.playAsync();
                                    }
                                }
                            }
                        ],
                        { cancelable: false }
                    );
                }

                return newTrash;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [characterPosition, sound, isPaused]);

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            setCharacterPosition((prevPosition) => ({
                ...prevPosition,
                x: gestureState.moveX - 25,
            }));
        },
    });

    return (
        <View style={styles.container}>
            <Text style={styles.score}>Puntos: {score}</Text>
            <View
                style={[
                    styles.character,
                    {
                        left: characterPosition.x,
                        top: characterPosition.y,
                    },
                ]}
                {...panResponder.panHandlers}
            />
            {trash.map((item, index) => (
                <Trash key={index} x={item.x} y={item.y} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    score: {
        fontSize: 24,
        fontWeight: 'bold',
        position: 'absolute',
        top: 50,
        left: 20,
        color: '#ffffff',
    },
    character: {
        width: 50,
        height: 50,
        backgroundColor: '#006b80',
        position: 'absolute',
    },
    trash: {
        width: 30,
        height: 30,
        backgroundColor: '#6a2aa5',
        position: 'absolute',
    },
});

export default GameScreen;