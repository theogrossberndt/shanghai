"use client";

import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import SlidingCard from "/app/lib/slidingCard.tsx";
import styles from "./page.module.css";
import { auth, database } from './firebase.tsx';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { onValue, ref, remove, get, set, onChildAdded, onChildRemoved, runTransaction } from 'firebase/database';
import ChildMeasurer from "@/app/lib/childMeasurer.tsx";

export default function Splash() {
	const sliderRef = useRef(null);
	const gameRef = useRef(null);
	const currentUserRef = useRef(null);
	const playersListRef = useRef(null);

	const [initialCardStack, setInitialCardStack] = useState<array<string> | null>(null);
	const [players, setPlayers] = useState(null);
	const [pwVisible, setPwVisible] = useState<boolean>(false);
	const [currentUser, setCurrentUser] = useState(null);
	const [snackBar, setSnackBar] = useState(null);
	const [manualAuth, setManualAuth] = useState<boolean>(false);
	const [game, setGame] = useState<string | null>(null);
	const [availGames, setAvailGames] = useState<array<string>>([]);

	const [cardDims, setCardDims] = useState({width: 0, height: 0});

	const createGame = () => {
		const counterRef = ref(database, 'gameList/counter');
		runTransaction(counterRef, counter => {
			return counter + 1;
		}).then(res => {
			console.log("transaction done?", res);
			if (res.committed){
				const gameId = "G" + res.snapshot.val();
				console.log(gameId);
				set(ref(database, 'gameList/games'), {
					[gameId]: true
				});
				set(ref(database, "games"), {
					[gameId]: {
						players: {
							[currentUserRef.current.uid]: currentUserRef.current.displayName,
							order: [currentUserRef.current.uid],
							admin: currentUserRef.current.uid
						},
						state: 'created',
					}
				});
				joinGame(gameId);
			}
		});
	}

	const leaveGame = () => {
		get(ref(database, 'games/' + gameRef.current + '/players/admin')).then(snapshot => {
			if (!snapshot.exists())
				return;
			console.log(snapshot.val());
			if (snapshot.val() == currentUserRef.current.uid){
				remove(ref(database, 'games/' + gameRef.current));
				remove(ref(database, 'gameList/games/' + gameRef.current));
				remove(ref(database, 'users/' + currentUserRef.current.uid + '/currentGame'));
				setGame(null);
				setPlayers(null);
			} else {
				runTransaction(ref(database, 'games/' + gameRef.current + '/players'), oldPlayers => {
					if (oldPlayers)
						return {
							...oldPlayers,
							order: oldPlayers.order.filter(uid => uid != currentUser.uid)
						}
					return null;
				}).then(() => remove(ref(database, 'users/' + currentUserRef.current.uid + '/currentGame')));
			}
		});
	}

	const kickPlayer = (kickUid) => {
		runTransaction(ref(database, 'games/' + gameRef.current + '/players'), oldPlayers => {
			if (oldPlayers)
				return {
					...oldPlayers,
					[kickUid]: null,
					order: oldPlayers.order.filter(uid => uid != kickUid),
					admin: (oldPlayers.admin == kickUid ? currentUserRef.current.uid : oldPlayers.admin)
				}
					if (sliderRef.current.currentId() == 'gameWaiting')
			return null;
		}).then(() => {
			remove(ref(database, 'users/' + kickUid + '/currentGame'));
		});
	}

	console.log(availGames);

	const addGameListListener = () => {
		const gameListRef = ref(database, 'gameList/games');
		onValue(gameListRef, snapshot => {
//			console.log("games updated", snapshot);
			if (!snapshot.exists()){
//				console.log("does not exist", gameRef.current);
				if (gameRef.current != null){
					remove(ref(database, 'users/' + currentUserRef.current.uid + '/currentGame'));
					setGame(null);
					setPlayers(null);
					setAvailGames([]);
					if (sliderRef.current.currentId() == 'gameWaiting')
						sliderRef.current.goBackward();
				}
				else
					setAvailGames([]);
				return;
			}
			let games = []
			snapshot.forEach(childSnapshot => {
				if (childSnapshot.val())
					games.push(childSnapshot.key);
			})
			if (gameRef.current != null && games.indexOf(gameRef.current) < 0){
//				console.log("Exiting game");
				remove(ref(database, 'users/' + currentUserRef.current.uid + '/currentGame'));
				setGame(null);
				setPlayers(null);
				if (sliderRef.current.currentId() == 'gameWaiting')
					sliderRef.current.goBackward();
			}
			setAvailGames(games);
		});
	}

	console.log("game", game);
	gameRef.current = game;
	currentUserRef.current = currentUser;

	const joinGame = (gameId, slide = true) => {
		setGame(gameId);
		const playersRef = ref(database, 'games/' + gameId + '/players');
		onValue(playersRef, snapshot => {
			console.log("players updated", snapshot.val());
			if (snapshot.val() && !Object.hasOwn(snapshot.val(), currentUserRef.current.uid)){
				setPlayers(null);
				setGame(null);
				if (sliderRef.current.currentId() == 'gameWaiting')
					sliderRef.current.goBackward();
			} else
				setPlayers(snapshot.val());
		});
		const userRef = ref(database, 'users/' + currentUserRef.current.uid + "/currentGame");
		set(userRef, gameId)
			.then(() => {
				if (slide)
					sliderRef.current.goForward("gameWaiting")
			});
	}

	useEffect(() => {
		if (snackBar && snackBar.timeout > 0)
			setTimeout(() => setSnackBar(null), snackBar.timeout);
	}, [snackBar])


	console.log(initialCardStack == null);

	auth.authStateReady()
		.then(() => {
			if (!auth.currentUser){
				console.log("Received null current user");
				if (currentUser != null){
					setCurrentUser(null);
				}
				if (initialCardStack == null)
					setInitialCardStack([]);
				return;
			}
			console.log("Ready!", manualAuth, auth.currentUser);
/*
*
*			Uncomment for auto login and comment out following if
*
*/
//			if (!currentUser || auth.currentUser.uid != currentUser.uid)
//				setCurrentUser(auth.currentUser);
			if (!initialCardStack)
				setInitialCardStack([]);
		});

//	console.log("currentUser:", currentUser);

	useEffect(() => {
		console.log("current user changed", manualAuth, currentUser);
		if (!manualAuth && currentUser != null){
			console.log("setting snackbar");
			setSnackBar({timeout: 3000, child: (
				<h3>Signed you in automatically!</h3>
			)});
		}
		if (currentUser != null){
			get(ref(database, 'users/' + currentUserRef.current.uid + '/currentGame'))
				.then(snapshot => {
					if (snapshot.exists()){
						joinGame(snapshot.val(), false);
						console.log("joining game");
						if (sliderRef.current)
							sliderRef.current.setStack(['home', 'logIn', 'game', 'gameWaiting'], manualAuth ? 1 : 0);
						else
							setInitialCardStack(['home', 'logIn', 'game', 'gameWaiting']);
					} else {
						if (sliderRef.current)
							sliderRef.current.setStack(['home', 'logIn', 'game'], manualAuth ? 1 : 0);
						else
							setInitialCardStack(['home', 'logIn', 'game']);
					}
				});
		}
	}, [currentUser]);

	const measureCard = (childMaxDims) => {
		console.log("cardDims", childMaxDims);
		if (childMaxDims.width != cardDims.width || childMaxDims.height != cardDims.height)
			setCardDims(childMaxDims);
	}

	const buildDeepCard = (id, backId, header, children, onBack?) => {
//		console.log("rebuild", id);
		return (
			<div id={id} className={styles.slidingCardDeepChild}>
				<div className={styles.cardHeader}>
					<button onClick={() => {
						if (onBack)
							onBack();
						sliderRef.current.goBackward(backId);
					}} className={styles.roundButton}>&lt;</button>
					{header}
				</div>
				{children}
			</div>
		);
	}

	const formSubmit = async (e, formType) => {
		e.preventDefault();
		setManualAuth(true);
		console.log("manual auth true");
		const formData = new FormData(e.target);
	    const formJson = Object.fromEntries(formData.entries());

		if (formType == 'signup')
			await createUserWithEmailAndPassword(auth, formJson.email, formJson.password)
				.then(userCredentials => {
					const user = userCredentials.user;
					console.log("createUser returned", user);
					updateProfile(user, {
						displayName: formJson.userName
					});
					setCurrentUser(user);
//					sliderRef.current.goForward('game');
				})
				.catch(error => {
					if (error.code == "auth/invalid-email")
						setSnackBar({timeout: 3000, child: (
							<h3>Invalid email format</h3>
						)});
					if (error.code == "auth/email-already-in-use")
						setSnackBar({timeout: 5000, child: (
							<div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
								<h3>This email is already in use</h3>
								<button type="button" style={{border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer'}}
									onClick={() => sliderRef.current.setStack(['home', 'logIn'])}><h3>Log In</h3></button>
								<h3>or</h3>
								<button type="button" style={{border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer'}}
									onClick={() => sliderRef.current.goForward('reset')}><h3>Reset Password</h3></button>
							</div>
						)})
					if (error.code == "auth/weak-password")
						setSnackBar({timeout: 3000, child: (
							<h3>Password must be at least 6 characters</h3>
						)});
					console.log("create error: ", error.message);
				});
		else if (formType == 'login')
			await signInWithEmailAndPassword(auth, formJson.email, formJson.password)
				.then(userCredentials => {
					console.log("signIn returned", userCredentials.user);
					setCurrentUser(userCredentials.user);
//					sliderRef.current.goForward('game');
				})
				.catch(error => {
					if (error.code == "auth/invalid-email")
						setSnackBar({timeout: 3000, child: (
							<h3>Invalid email format</h3>
						)});
					if (error.code == 'auth/invalid-credential')
						setSnackBar({timeout: 3000, child: (
							<h3>Invalid email or password</h3>
						)})
					if (error.code == 'auth/too-many-requests')
						setSnackBar({timeout: 3000, child: (
							<h3>Too many requests, try again later</h3>
						)})
					console.log("sign in error:", error.code);
				})
		else if (formType == 'reset')
			await sendPasswordResetEmail(auth, formJson.email)
				.then(() => {
					setSnackBar({timeout: 3000, child: (
						<h3>Check your email for a password reset link</h3>
					)})
					sliderRef.current.goBackward('logIn');
				})
				.catch(error => {
					if (error.code == "auth/invalid-email")
						setSnackBar({timeout: 3000, child: (
							<h3>Invalid email format</h3>
						)});
					console.log("password reset error:", error.code);
				});
		else if (formType == 'join'){
			let gameCode = formJson.code.toUpperCase();
			if (!gameCode.startsWith('G'))
				gameCode = 'G' + gameCode;
			if (availGames.indexOf(gameCode) >= 0){
				console.log(gameCode);
				runTransaction(ref(database, 'games/' + gameCode + '/players'), oldPlayers => {
					console.log(oldPlayers);
					if (oldPlayers)
						return {
							...oldPlayers,
							[currentUser.uid]: currentUser.displayName,
							order: [...oldPlayers.order, currentUser.uid]
						}
					return null;
				}).then(res => joinGame(gameCode));
			} else
				setSnackBar({timeout: 3000, child: (<h3>Invalid game code</h3>)});
		}
	}

	const writeOrderChange = () => {
		set(ref(database, 'games/' + gameRef.current + '/players/order'), players.order);
	}

	const movePlayer = (i, direction) => {
		if (!players)
			return;
		let order = players.order;
		[order[i], order[i+direction]] = [order[i+direction], order[i]];
		set(ref(database, 'games/' + gameRef.current + '/players/order'), order);
//			.then((error) => {
//				setPlayers(players);
//			});
	}

	const startGame = () => {
		console.log("starting");
	}

	console.log("Players:", players);

	return (
	    <main className={styles.main}>
	    	<ChildMeasurer setMaxDimensions={measureCard}>
	    		<div className={styles.mainCard}>
	    		</div>
	    	</ChildMeasurer>
			<div className={styles.mainCard}>
				{initialCardStack != null && (
				<SlidingCard ref={sliderRef} cardDims={cardDims} initialStack={initialCardStack}>
					<div id="home" className={styles.slidingCardChild}>
						<button className={styles.button} onClick={() => sliderRef.current.goForward("logIn")}>Log In</button>
						<button className={styles.button} onClick={() => sliderRef.current.goForward("signUp")}>Sign Up</button>
					</div>

					{buildDeepCard("logIn", "home", (<h3>Log In</h3>), (
						<Fragment>
							<form method="post" onSubmit={e => formSubmit(e, "login")} style={{position: 'relative', height: '100%'}}>
								<div className={styles.formLine}>
									<label htmlFor="email">
										<FontAwesomeIcon icon={faEnvelope} style={{width: '1.5rem', height: '1.5rem'}}/>
									</label>
									<input type="text" id="email" name="email" placeholder="Email" required/>
								</div>
								<div className={styles.formLine}>
									<label htmlFor="password">
										<FontAwesomeIcon icon={faKey} style={{width: '1.5rem', height: '1.5rem'}}/>
									</label>
									<input type={pwVisible ? "text" : "password"} id="password" name="password" placeholder="Password" required/>
									<button type="button" onClick={e => {
										e.preventDefault();
										setPwVisible(visible => !visible);
									}} style={{border: 'none', background: 'none', cusor: 'pointer'}}>
										{pwVisible ?
											(<FontAwesomeIcon icon={faEyeSlash} style={{width: '1.5rem', height: '1.5rem'}}/>) :
											(<FontAwesomeIcon icon={faEye} style={{width: '1.5rem', height: '1.5rem'}}/>)
										}
									</button>
								</div>
								<div>
									<button type="button" style={{border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer'}}
										onClick={() => sliderRef.current.goForward('reset')}>Reset Password</button>
								</div>
								<input type="submit" className={styles.button} value="Continue" style={{position: 'absolute', bottom: 0}}/>
							</form>
						</Fragment>
					))}

					{buildDeepCard('reset', null, (<h3>Reset Password</h3>), (
							<form method="post" onSubmit={e => formSubmit(e, "reset")} style={{position: 'relative', height: '100%'}}>
								<div className={styles.formLine}>
									<label htmlFor="email">
										<FontAwesomeIcon icon={faEnvelope} style={{width: '1.5rem', height: '1.5rem'}}/>
									</label>
									<input type="text" id="email" name="email" placeholder="Email" required/>
								</div>
								<input type="submit" className={styles.button} value="Send Password Reset Email" style={{position: 'absolute', bottom: 0}}/>
							</form>
					))}

					{buildDeepCard("signUp", "home", (<h3>Sign Up</h3>), (
						<Fragment>
							<form method="post" onSubmit={e => formSubmit(e, "signup")} style={{position: 'relative', height: '100%'}}>
								<div className={styles.formLine}>
									<label htmlFor="email">
										<FontAwesomeIcon icon={faEnvelope} style={{width: '1.5rem', height: '1.5rem'}}/>
									</label>
									<input type="text" id="email" name="email" placeholder="Email" required/>
								</div>
								<div className={styles.formLine}>
									<label htmlFor="userName">
										<FontAwesomeIcon icon={faUser} style={{width: '1.5rem', height: '1.5rem'}}/>
									</label>
									<input type="text" id="userName" name="userName" placeholder="Username" required/>
								</div>
								<div className={styles.formLine}>
									<label htmlFor="password">
										<FontAwesomeIcon icon={faKey} style={{width: '1.5rem', height: '1.5rem'}}/>
									</label>
									<input type={pwVisible ? "text" : "password"} id="password" name="password" placeholder="Password" required/>
									<button type="button" onClick={e => {
										e.preventDefault();
										setPwVisible(visible => !visible);
									}} style={{border: 'none', background: 'none', cusor: 'pointer'}}>
										{pwVisible ?
											(<FontAwesomeIcon icon={faEyeSlash} style={{width: '1.5rem', height: '1.5rem'}}/>) :
											(<FontAwesomeIcon icon={faEye} style={{width: '1.5rem', height: '1.5rem'}}/>)
										}
									</button>
								</div>
								<input type="submit" className={styles.button} value="Continue" style={{position: 'absolute', bottom: 0}}/>
							</form>
						</Fragment>
					))}

					{buildDeepCard("game", null, (<h3>Welcome {currentUser?.displayName}</h3>), (
						<Fragment>
							<button className={styles.button} onClick={createGame}>Create Game</button>
							<button className={styles.button} onClick={() => {
								addGameListListener();
								sliderRef.current.goForward("joinGame");
							}}>Join Game</button>
						</Fragment>
					), () => {
						console.log("signing out");
						auth.signOut().then(() => {
							setCurrentUser(null);
						});
					})}

					{buildDeepCard("joinGame", null, (<h3>Join A Game</h3>), (
						<form method="post" onSubmit={e => formSubmit(e, "join")} style={{position: 'relative', height: '100%'}}>
							<div className={styles.formLine}>
								<label htmlFor="code">
									<span class="material-icons">dialpad</span>
								</label>
								<input type="text" id="code" name="code" placeholder="Enter a Game Code" required/>
							</div>
							<input type="submit" className={styles.button} value="Continue" style={{position: 'absolute', bottom: 0}}/>
						</form>
					))}

					{buildDeepCard("gameWaiting", null, (<h3>Waiting For Players</h3>), (
						<Fragment>
							<div style={{display: 'flex', justifyContent: 'space-between'}}>
								<h3>Game Code</h3>
								<h3 style={{fontWeight: 'normal'}}>{game}</h3>
							</div>
							<Reorder.Group style={{backgroundColor: '#eee', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', flex: 1, borderRadius: '1rem'}}
								axis='y' values={players ? players.order : [0]} as="div" onReorder={(newOrder) => setPlayers({...players, order: newOrder})}
								onMouseUp={writeOrderChange} onTouchEnd={writeOrderChange}
							>
								{players ? players?.order?.map((uid, i) => {
									const isFirst = i == 0;
									const isLast = i >= (players?.order ? Object.keys(players.order).length : 1)-1;
									const clickableToStyle = (isClickable) => ({paddingRight: '1rem', color: isClickable ? '#000' : '#ccc', cursor: isClickable ? 'pointer' : 'default'});
									return (
									<Reorder.Item key={uid} style={{display: 'flex', justifyContent: 'space-between'}} value={uid} as="div">
										<div>
											{i+1}.
											{players ? players[uid] + (uid == currentUser.uid ? ' (You)' : '') : ''}
										</div>
										<button className={styles.defaultButton} style={{color: 'red'}} onClick={() => kickPlayer(uid)}>
											<span class="material-icons">close</span>
										</button>
									</Reorder.Item>
								);
								}) : (
									<Reorder.Item key={0} value={0}>
										{0}
									</Reorder.Item>
								)}
							</Reorder.Group>
							<button className={[styles.button, players?.order?.length > 2 ? "" : styles.disabledButton].join(' ')} style={{fontWeight: 'bold', fontSize: '1rem'}} onClick={startGame}>BEGIN</button>
						</Fragment>
					), leaveGame)}

				</SlidingCard>)}
			</div>

			<AnimatePresence>
				{snackBar && (
					<motion.div className={styles.snackBar} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
						{snackBar.child}
					</motion.div>
				)}
			</AnimatePresence>
	    </main>
	);
}
