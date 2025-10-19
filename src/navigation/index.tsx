import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector, useDispatch } from "react-redux";
import AllProductsScreen from "../screens/AllProductsScreen";
import CategoryScreen from "../screens/CategoryScreen";
import LoginScreen from "../screens/LoginScreen";
import { logout } from "../store/authSlice";
import { TouchableOpacity, Text } from "react-native";
import { Home, Grid } from "lucide-react-native";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HeaderRight() {
  const dispatch = useDispatch();
  return (
    <TouchableOpacity onPress={() => dispatch(logout())} style={{ marginRight: 12 }}>
      <Text style={{ color: '#007AFF', fontWeight: '600' }}>Sign Out</Text>
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
          name="AllProducts"
          component={AllProductsScreen}
          options={{
            title: "Products",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Category"
          component={CategoryScreen}
          options={{
            title: "Category",
            tabBarIcon: ({ color, size }) => <Grid color={color} size={size} />,
          }}
        />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const locked = useSelector((state: any) => state.ui.locked);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated || locked ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={({ navigation }) => ({
              headerTitle: 'Store',
              headerRight: () => <HeaderRight />,
            })}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
