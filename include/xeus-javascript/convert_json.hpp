#pragma once

#include <nlohmann/json.hpp>
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>

// decay_t
#include <type_traits>

namespace emscripten {
namespace internal {

namespace nl = nlohmann;

template <>
struct BindingType<nl::json> {
    using ValBinding = BindingType<val>;
    using WireType = typename ValBinding::WireType;

    static WireType toWireType(const nl::json& obj) {
        // as string
        const auto str = obj.dump();
        const auto jstr = val(str.c_str());
        const auto js_obj = val::global("JSON").call<val>("parse", jstr);
        return ValBinding::toWireType(js_obj);
    }

    static nl::json fromWireType(WireType value) {
        // first as emscripten::val
        const auto js_obj = ValBinding::fromWireType(value);
        // then as string
        const auto jstr = val::global("JSON").call<val>("stringify", js_obj);
        const auto str = jstr.as<std::string>();
        return nl::json::parse(str);
    }
};


template <typename T>
using is_decayed_json = std::is_same<std::decay_t<T>, nl::json>;

template <typename T>
using enable_if_decayed_json = typename std::enable_if<is_decayed_json<T>::value, void>::type;

template<class T>
struct TypeID<T, enable_if_decayed_json<T> > {
    static constexpr TYPEID get() {
        return LightTypeID<val>::get();
    }
};






// template <>
// struct TypeID<nl::json> {
//     static constexpr TYPEID get() {
//         return LightTypeID<val>::get();
//     }
// };

// template <>
// struct TypeID<const nl::json> {
//     static constexpr TYPEID get() {
//         return LightTypeID<val>::get();
//     }
// };

// template <>
// struct TypeID< nl::json  && > {
//     static constexpr TYPEID get() {
//         return LightTypeID<val>::get();
//     }
// };


// template <>
// struct TypeID<nl::json&> {
//     static constexpr TYPEID get() {
//         return LightTypeID<val>::get();
//     }
// };

// template <>
// struct TypeID<const nl::json&> {
//     static constexpr TYPEID get() {
//         return LightTypeID<val>::get();
//     }
// };

}  // namespace internal
}  // namespace emscripten
