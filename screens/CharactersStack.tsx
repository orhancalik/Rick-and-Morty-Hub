import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import CharactersScreen from "./CharactersScreen";
import CharacterDetailScreen from "./CharacterDetailScreen";
import AddCharacterScreen from "./AddCharacterScreen";
import { Character } from "../types";

export type CharactersStackParamList = {
  Characters: undefined;
  CharacterDetail: { character: Character };
  AddCharacter: undefined;
};

const Stack = createStackNavigator<CharactersStackParamList>();

export default function CharactersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Characters"
        component={CharactersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CharacterDetail"
        component={CharacterDetailScreen}
        options={{ title: "Karakter Detail", headerShown: false }}
      />
      <Stack.Screen
        name="AddCharacter"
        component={AddCharacterScreen}
        options={{ title: "Nieuw Karakter" }}
      />
    </Stack.Navigator>
  );
}
